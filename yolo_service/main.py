import os
import io
import base64
import numpy as np
import cv2
import onnxruntime as ort
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel
from typing import List, Optional
import urllib.request

app = FastAPI(title="YOLOv8n Object Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

COCO_CLASSES = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
    "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
    "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
    "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
    "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
    "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse",
    "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator",
    "book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"
]

CATEGORY_MAPPING = {
    "person": "person",
    "bicycle": "vehicle", "car": "vehicle", "motorcycle": "vehicle", "airplane": "vehicle",
    "bus": "vehicle", "train": "vehicle", "truck": "vehicle", "boat": "vehicle",
    "knife": "weapon", "scissors": "weapon",
    "cell phone": "electronics", "laptop": "electronics", "mouse": "electronics",
    "remote": "electronics", "keyboard": "electronics", "tv": "electronics", "microwave": "electronics",
    "oven": "electronics", "toaster": "electronics", "refrigerator": "electronics",
    "book": "document",
    "bottle": "other", "wine glass": "other", "cup": "other", "fork": "tools", "spoon": "tools",
    "bowl": "other", "clock": "other", "vase": "other", "toothbrush": "other",
    "backpack": "other", "umbrella": "other", "handbag": "other", "tie": "other", "suitcase": "other",
}

model = None

def download_model():
    model_path = os.path.join(os.path.dirname(__file__), "yolov8n.onnx")
    if not os.path.exists(model_path) or os.path.getsize(model_path) < 1000:
        print("Downloading YOLOv8n ONNX model...")
        urls = [
            "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.onnx",
            "https://objects.githubusercontent.com/github-production-release-asset-2e65be/287557088/7d00bea8-4ea4-4e42-8dbe-b7e22e9a44a1?X-Amz-Algorithm=AWS4-HMAC-SHA256",
        ]
        for url in urls:
            try:
                urllib.request.urlretrieve(url, model_path)
                if os.path.getsize(model_path) > 1000:
                    print(f"Model downloaded successfully from {url}")
                    break
            except Exception as e:
                print(f"Failed to download from {url}: {e}")
                continue
    return model_path

def load_model():
    global model
    if model is None:
        model_path = download_model()
        if os.path.exists(model_path) and os.path.getsize(model_path) > 1000:
            model = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
            print("YOLOv8n model loaded successfully")
        else:
            print("Failed to load model - file not found or too small")
    return model

def preprocess_image(image: np.ndarray, input_size: int = 640):
    h, w = image.shape[:2]
    scale = min(input_size / h, input_size / w)
    new_h, new_w = int(h * scale), int(w * scale)
    
    resized = cv2.resize(image, (new_w, new_h))
    
    padded = np.full((input_size, input_size, 3), 114, dtype=np.uint8)
    pad_h = (input_size - new_h) // 2
    pad_w = (input_size - new_w) // 2
    padded[pad_h:pad_h + new_h, pad_w:pad_w + new_w] = resized
    
    blob = padded.astype(np.float32) / 255.0
    blob = blob.transpose(2, 0, 1)
    blob = np.expand_dims(blob, axis=0)
    
    return blob, scale, pad_w, pad_h, w, h

def postprocess(outputs, scale, pad_w, pad_h, orig_w, orig_h, conf_threshold=0.25, iou_threshold=0.45):
    predictions = outputs[0][0].T
    
    boxes = predictions[:, :4]
    scores = predictions[:, 4:]
    
    class_ids = np.argmax(scores, axis=1)
    confidences = np.max(scores, axis=1)
    
    mask = confidences > conf_threshold
    boxes = boxes[mask]
    class_ids = class_ids[mask]
    confidences = confidences[mask]
    
    if len(boxes) == 0:
        return []
    
    x_center, y_center, w, h = boxes[:, 0], boxes[:, 1], boxes[:, 2], boxes[:, 3]
    x1 = (x_center - w / 2 - pad_w) / scale
    y1 = (y_center - h / 2 - pad_h) / scale
    x2 = (x_center + w / 2 - pad_w) / scale
    y2 = (y_center + h / 2 - pad_h) / scale
    
    x1 = np.clip(x1, 0, orig_w)
    y1 = np.clip(y1, 0, orig_h)
    x2 = np.clip(x2, 0, orig_w)
    y2 = np.clip(y2, 0, orig_h)
    
    boxes_xyxy = np.stack([x1, y1, x2, y2], axis=1)
    indices = cv2.dnn.NMSBoxes(boxes_xyxy.tolist(), confidences.tolist(), conf_threshold, iou_threshold)
    
    if len(indices) == 0:
        return []
    
    results = []
    for i in indices.flatten():
        box = boxes_xyxy[i]
        results.append({
            "class_id": int(class_ids[i]),
            "class_name": COCO_CLASSES[int(class_ids[i])],
            "confidence": float(confidences[i]),
            "bbox": {
                "x": float(box[0]) / orig_w,
                "y": float(box[1]) / orig_h,
                "width": float(box[2] - box[0]) / orig_w,
                "height": float(box[3] - box[1]) / orig_h,
            },
            "bbox_pixels": {
                "x1": int(box[0]),
                "y1": int(box[1]),
                "x2": int(box[2]),
                "y2": int(box[3]),
            }
        })
    
    return results

class DetectionResult(BaseModel):
    class_id: int
    class_name: str
    confidence: float
    category: str
    bbox: dict
    bbox_pixels: dict

class DetectionResponse(BaseModel):
    success: bool
    detections: List[DetectionResult]
    object_count: int
    model: str = "yolov8n"

@app.on_event("startup")
async def startup_event():
    load_model()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/detect", response_model=DetectionResponse)
async def detect_objects(file: UploadFile = File(...)):
    if model is None:
        return DetectionResponse(success=False, detections=[], object_count=0)
    
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        return DetectionResponse(success=False, detections=[], object_count=0)
    
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    blob, scale, pad_w, pad_h, orig_w, orig_h = preprocess_image(image_rgb)
    
    input_name = model.get_inputs()[0].name
    outputs = model.run(None, {input_name: blob})
    
    raw_detections = postprocess(outputs, scale, pad_w, pad_h, orig_w, orig_h)
    
    detections = []
    for det in raw_detections:
        category = CATEGORY_MAPPING.get(det["class_name"], "other")
        detections.append(DetectionResult(
            class_id=det["class_id"],
            class_name=det["class_name"],
            confidence=det["confidence"],
            category=category,
            bbox=det["bbox"],
            bbox_pixels=det["bbox_pixels"]
        ))
    
    return DetectionResponse(
        success=True,
        detections=detections,
        object_count=len(detections)
    )

@app.post("/detect-base64")
async def detect_objects_base64(data: dict):
    if model is None:
        return {"success": False, "detections": [], "object_count": 0}
    
    base64_image = data.get("image", "")
    if not base64_image:
        return {"success": False, "detections": [], "object_count": 0}
    
    if "," in base64_image:
        base64_image = base64_image.split(",")[1]
    
    image_bytes = base64.b64decode(base64_image)
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        return {"success": False, "detections": [], "object_count": 0}
    
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    blob, scale, pad_w, pad_h, orig_w, orig_h = preprocess_image(image_rgb)
    
    input_name = model.get_inputs()[0].name
    outputs = model.run(None, {input_name: blob})
    
    raw_detections = postprocess(outputs, scale, pad_w, pad_h, orig_w, orig_h)
    
    detections = []
    for det in raw_detections:
        category = CATEGORY_MAPPING.get(det["class_name"], "other")
        detections.append({
            "id": f"yolo_{det['class_id']}_{len(detections)}",
            "label": det["class_name"],
            "confidence": "high" if det["confidence"] > 0.7 else "medium" if det["confidence"] > 0.4 else "low",
            "confidence_score": det["confidence"],
            "category": category,
            "location": f"{det['bbox']['x']:.2f}, {det['bbox']['y']:.2f}",
            "boundingBox": det["bbox"]
        })
    
    return {
        "success": True,
        "detections": detections,
        "object_count": len(detections),
        "model": "yolov8n"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
