"""
================================================================================
  Lumixly Processing Backend — FastAPI
  Deploy to Render.com (free tier)
  This is the same logic as your local app.py but as a web service
================================================================================
"""

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio, io, os, httpx
from pathlib import Path

app = FastAPI(title="Lumixly Processing API")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SECRET = os.environ.get("PROCESSING_API_SECRET", "change-me")

# ── Models ────────────────────────────────────────────────────────────────────

class ProcessRequest(BaseModel):
    order_id: str
    crop_type: str
    input_paths: List[str]
    supabase_url: str
    supabase_key: str
    callback_url: str

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/process")
async def process_images(req: ProcessRequest, x_secret: str = Header(None)):
    if x_secret != SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")
    # Run in background — return immediately
    asyncio.create_task(run_processing(req))
    return {"status": "queued", "order_id": req.order_id}

async def run_processing(req: ProcessRequest):
    """Download images from Supabase, process, upload results, callback."""
    from supabase import create_client
    from PIL import Image, ImageOps
    from rembg import remove, new_session
    import numpy as np, io as sio, mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision

    supabase   = create_client(req.supabase_url, req.supabase_key)
    bg_session = new_session("birefnet-general")

    # Load face model for headless crop
    model_path = Path("/tmp/face_landmarker.task")
    if not model_path.exists():
        import urllib.request
        urllib.request.urlretrieve(
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            str(model_path))
    opts = vision.FaceLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=str(model_path)),
        num_faces=1, min_face_detection_confidence=0.2, min_face_presence_confidence=0.2)
    face_detector = vision.FaceLandmarker.create_from_options(opts)

    output_urls = []
    errors      = []

    for path in req.input_paths:
        try:
            # Download from Supabase storage
            res  = supabase.storage.from_("uploads").download(path)
            img  = Image.open(sio.BytesIO(res)).convert("RGB")
            img  = ImageOps.exif_transpose(img)
            iw, ih = img.size

            # Apply crop
            img = apply_crop(img, req.crop_type, iw, ih, face_detector, bg_session)

            # Remove background
            buf = sio.BytesIO()
            img.save(buf, format="PNG")
            no_bg = Image.open(sio.BytesIO(remove(buf.getvalue(), session=bg_session))).convert("RGBA")
            cropped = crop_tight(no_bg)

            # Save both sizes
            stem = Path(path).stem
            base = f"{req.order_id}/output"

            for size, suffix in [((2500,2500),"_ebay"), ((2011,2564),"_bg")]:
                canvas = fit_canvas(cropped, size)
                out_buf = sio.BytesIO()
                canvas.save(out_buf, format="JPEG", quality=95)
                out_buf.seek(0)
                out_path = f"{base}/{stem}{suffix}.jpg"
                supabase.storage.from_("outputs").upload(out_path, out_buf.getvalue())
                url = supabase.storage.from_("outputs").get_public_url(out_path)
                output_urls.append(url)

        except Exception as e:
            errors.append(str(e))

    # Callback to Next.js
    status = "done" if not errors else ("error" if len(errors) == len(req.input_paths) else "done")
    async with httpx.AsyncClient() as client:
        await client.post(req.callback_url, json={
            "order_id":   req.order_id,
            "status":     status,
            "output_urls": output_urls,
            "error": "; ".join(errors) if errors else None,
        }, headers={"X-Secret": SECRET})

# ── Processing helpers ────────────────────────────────────────────────────────

def apply_crop(img, crop_type, iw, ih, face_detector, bg_session):
    if crop_type == "headless":
        cut = detect_lips(img, iw, ih, face_detector)
        return img.crop((0, cut, iw, ih))
    elif crop_type == "full_body":
        return img.crop((0, int(ih*0.03), iw, ih))
    elif crop_type == "upper_half":
        return img.crop((0, int(ih*0.03), iw, int(ih*0.50)))
    elif crop_type == "head_knees":
        return img.crop((0, int(ih*0.03), iw, int(ih*0.68)))
    elif crop_type == "closer":
        return img  # tight crop after bg removal
    else:
        return img  # no_crop, product

def detect_lips(img, iw, ih, face_detector):
    try:
        top_h   = int(ih * 0.25)
        top_img = img.crop((0, 0, iw, top_h))
        scale   = min(1.0, 1200/iw)
        small   = top_img.resize((int(iw*scale), int(top_h*scale)))
        mp_img  = mp.Image(image_format=mp.ImageFormat.SRGB, data=__import__('numpy').array(small))
        result  = face_detector.detect(mp_img)
        if result.face_landmarks:
            lm     = result.face_landmarks[0]
            nose_y = int(lm[4].y * top_h)
            lip_y  = int(lm[13].y * top_h)
            cut_y  = nose_y + int((lip_y - nose_y) * 0.5)
            return max(0, min(ih-1, cut_y))
    except:
        pass
    return int(ih * 0.02)

def crop_tight(image, padding=50):
    import numpy as np
    alpha  = np.array(image.split()[3])
    rows   = np.any(alpha > 10, axis=1)
    cols   = np.any(alpha > 10, axis=0)
    if not rows.any(): return image
    top    = max(0,            int(np.argmax(rows))                - padding)
    bottom = min(image.height, int(len(rows)-np.argmax(rows[::-1])) + padding)
    left   = max(0,            int(np.argmax(cols))                - padding)
    right  = min(image.width,  int(len(cols)-np.argmax(cols[::-1])) + padding)
    return image.crop((left, top, right, bottom))

def fit_canvas(image, size):
    from PIL import Image as PILImage
    import numpy as np
    tw, th = size
    iw, ih = image.size
    scale  = min(tw/iw, th/ih)
    nw, nh = int(iw*scale), int(ih*scale)
    resized = image.resize((nw, nh), PILImage.LANCZOS)
    canvas  = PILImage.new("RGBA", (tw, th), (255,255,255,255))
    canvas.paste(resized, ((tw-nw)//2,(th-nh)//2), resized)
    return canvas.convert("RGB")
