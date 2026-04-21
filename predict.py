from ultralytics import YOLO

if __name__ == '__main__':
    # 加载训练好的模型
    model = YOLO("runs/detect/train/weights/best.pt")

    # 商品识别预测（最稳定写法）
    results = model.predict(
        source="predict/1.jpg",     # 必须和代码放在同一文件夹
        save=True,             # 保存结果图片
        save_txt=False,        # 不需要txt就关掉，更干净
        show=True,             # 弹出窗口显示结果
        conf=0.25,             # 置信度阈值
        line_width=2           # 画框粗细
    )