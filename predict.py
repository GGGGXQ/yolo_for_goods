from ultralytics import YOLO
from class_mapping import CLASS_NAMES
from collections import Counter

if __name__ == '__main__':
    # 加载训练好的模型
    model = YOLO("runs/detect/train/weights/best.pt")

    # 商品识别预测（最稳定写法）
    results = model.predict(
        source="./datas/ori_TEST20191017145027196-2_0.jpg",     # 必须和代码放在同一文件夹
        save=False,             # 保存结果图片
        save_txt=False,        # 不需要txt就关掉，更干净
        show=False,             # 弹出窗口显示结果
        conf=0.25,             # 置信度阈值
        line_width=2           # 画框粗细
    )

    # 获取识别结果并统计
    result = results[0]
    class_ids = result.boxes.cls.cpu().numpy().astype(int)

    name_counts = Counter()
    for cls_id in class_ids:
        name = CLASS_NAMES.get(cls_id, f"未知_{cls_id}")
        name_counts[name] += 1

    print("识别结果:")
    for name, count in name_counts.items():
        print(f"  {name}: {count}个")
    print(f"\n总计: {sum(name_counts.values())}个物品")