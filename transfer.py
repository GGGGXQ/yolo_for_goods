import os
import xml.etree.ElementTree as ET

# ========== 路径完全匹配你的文件夹，不用改 ==========
# 读取商品类别
with open("./goods/labels.txt", "r", encoding="utf-8") as f:
    classes = [c.strip() for c in f.readlines()]
class2id = {cls: idx for idx, cls in enumerate(classes)}

xml_dir = "./goods/Annotations"    # VOC标注文件夹
img_dir = "./goods/images"          # 图片文件夹
out_label_dir = "./goods/labels"   # 输出YOLO标签文件夹
os.makedirs(out_label_dir, exist_ok=True)

# 批量转换xml -> yolo txt标签
for xml_file in os.listdir(xml_dir):
    if not xml_file.endswith(".xml"):
        continue
    tree = ET.parse(os.path.join(xml_dir, xml_file))
    root = tree.getroot()
    img_w = int(root.find("size/width").text)
    img_h = int(root.find("size/height").text)

    txt_name = xml_file.replace(".xml", ".txt")
    with open(os.path.join(out_label_dir, txt_name), "w") as f:
        for obj in root.findall("object"):
            cls_name = obj.find("name").text
            if cls_name not in class2id:
                continue
            cls_id = class2id[cls_name]
            # VOC坐标转YOLO归一化坐标
            x1 = float(obj.find("bndbox/xmin").text)
            y1 = float(obj.find("bndbox/ymin").text)
            x2 = float(obj.find("bndbox/xmax").text)
            y2 = float(obj.find("bndbox/ymax").text)
            x = (x1 + x2) / 2 / img_w
            y = (y1 + y2) / 2 / img_h
            w = (x2 - x1) / img_w
            h = (y2 - y1) / img_h
            f.write(f"{cls_id} {x:.6f} {y:.6f} {w:.6f} {h:.6f}\n")

# 自动生成训练/验证集路径文件（放在项目根目录）
with open("./goods/val_list.txt","r") as f:
    val_names = [line.strip() for line in f.readlines()]
all_names = [n[:-4] for n in os.listdir(img_dir) if n.endswith(".jpg")]
train_names = [n for n in all_names if n not in val_names]

with open("./train.txt","w") as f:
    f.writelines([f"./goods/images/{n}.jpg\n" for n in train_names])
with open("./val.txt","w") as f:
    f.writelines([f"./goods/images/{n}.jpg\n" for n in val_names])

print("VOC数据集转YOLO格式完成")