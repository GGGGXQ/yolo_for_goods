from ultralytics import YOLO

if __name__ == '__main__':
    model = YOLO("yolo26s.pt")

    model.train(
        data=r"D:\Product identification\goods\goods.yaml",
        epochs=100,
        imgsz=640,
        batch=4,
        workers=0,
        device=0
    )