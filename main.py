import subprocess
import sys

def run_script(script_name):
    """运行另一个 Python 文件"""
    print(f"\n正在运行：{script_name}")
    result = subprocess.run([sys.executable, script_name])
    if result.returncode != 0:
        print(f"{script_name} 运行失败！")
        sys.exit(1)

if __name__ == '__main__':
    # 第一步：运行 VOC 转 YOLO
    run_script("transfer.py")
    # 第二步：运行训练
    run_script("train.py")

    print("\n全部运行完成！")