from time import sleep
from flask import Flask, render_template, request, jsonify, redirect, url_for, send_from_directory, send_file, session, \
    after_this_request
from bs4 import BeautifulSoup
import pandas as pd
import json
import platform
import time
import os
import shutil
import argparse
import zipfile
import subprocess

app = Flask(__name__)
app.secret_key = 'BrownRadAi'  # 设置 secret_key，不设置无法用 session


# 欢迎页面
@app.route('/')
def welcome():
    return render_template('welcome.html')


# 开始问卷调查
@app.route('/start-survey', methods=['POST'])
def start_survey():
    participant_name = request.form.get('participant_name')
    survey_type = request.form.get('survey_type')
    timestamp = int(time.time())

    # 将用户信息存储到 session
    session['participant_name'] = participant_name
    session['survey_type'] = survey_type
    session['timestamp'] = timestamp

    # 定义结果存储路径
    CURRENT_FOLDER = os.path.join(RESULT_FOLDER, f"{participant_name}_{survey_type}_{timestamp}")
    SURVEY_RESULT_FILE = os.path.join(CURRENT_FOLDER, 'survey_result.jsonl')
    EYE_TRACKING_PATH = os.path.join(CURRENT_FOLDER, 'eye_tracking', '')
    MOUSE_TRACKING_PATH = os.path.join(CURRENT_FOLDER, 'mouse_tracking', '')
    WEBPAGE_PATH = os.path.join(CURRENT_FOLDER, 'webpage', '')

    # 创建必要的文件夹
    for path in [EYE_TRACKING_PATH, MOUSE_TRACKING_PATH, WEBPAGE_PATH]:
        os.makedirs(path, exist_ok=True)

    # 更新 session
    session.update({
        'RESULT_FILENAME': f"{participant_name}_{survey_type}_{timestamp}",
        'RESULT_FOLDER': RESULT_FOLDER,
        'CURRENT_FOLDER': CURRENT_FOLDER,
        'SURVEY_RESULT_FILE': SURVEY_RESULT_FILE,
        'EYE_TRACKING_PATH': EYE_TRACKING_PATH,
        'MOUSE_TRACKING_PATH': MOUSE_TRACKING_PATH,
        'WEBPAGE_PATH': WEBPAGE_PATH
    })

    return redirect(url_for('survey'))


# 问卷调查页面
@app.route('/survey')
def survey():
    participant_name = session.get('participant_name', 'Participant')
    survey_type = session.get('survey_type', 'A')
    return render_template(
        'survey.html',
        item=image_reports[0],
        num_of_images=num_of_images,
        participant_name=participant_name,
        survey_type=survey_type,
        debug=args.debug,
        interval=args.interval,
        video_preview=args.videopreview,
        result_filename=session['RESULT_FILENAME'],
        result_folder=session['RESULT_FOLDER']
    )


# 创建压缩文件
def create_zip(zip_name, root_dir, items):
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for item in items:
            item_path = os.path.join(root_dir, item)
            if os.path.exists(item_path):
                if os.path.isdir(item_path):
                    for root, _, files in os.walk(item_path):
                        for file in files:
                            file_path = os.path.join(root, file)
                            arcname = os.path.relpath(file_path, root_dir)  # 使用相对路径
                            zipf.write(file_path, arcname)
                else:
                    arcname = os.path.relpath(item_path, root_dir)
                    zipf.write(item_path, arcname)


@app.route('/submit', methods=['POST'])
def submit():
    data = request.json
    print("Received data:", data)

    try:
        with open(session['SURVEY_RESULT_FILE'], 'a') as file:
            json.dump(data, file)
            file.write('\n')
    except Exception as e:
        print(f"Error saving survey result: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

    # 判断是否还有下一张图片
    if int(data['index']) < len(image_reports) - 1:
        return jsonify(image_reports[int(data['index'])])
    elif int(data['index']) == len(image_reports) - 1:
        msg = image_reports[int(data['index'])]
        msg["status"] = "almost_finished"
        return jsonify(msg)
    else:
        return jsonify({"status": "finished", "message": "Thank you for participating!"})


# 接收眼动数据
@app.route('/eye-data', methods=['POST'])
def receive_eye_data():
    data = request.json
    print("Received eye-tracking data:", data)

    try:
        eye_tracking_file = os.path.join(session['EYE_TRACKING_PATH'], f'{data["index"]}.jsonl')
        with open(eye_tracking_file, 'a') as file:
            json.dump(data, file)
            file.write('\n')
    except Exception as e:
        print(f"Error saving eye-tracking data: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

    return jsonify({"status": "success"})


# 接收鼠标位置数据
@app.route('/mouse-position', methods=['POST'])
def receive_mouse_position():
    data = request.json
    print("Received mouse-position data:", data)

    try:
        mouse_tracking_file = os.path.join(session['MOUSE_TRACKING_PATH'], f'{data["index"]}.jsonl')
        with open(mouse_tracking_file, 'a') as file:
            json.dump(data, file)
            file.write('\n')
    except Exception as e:
        print(f"Error saving mouse-position data: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

    return jsonify({"status": "success"})


# 接收网页操作数据
# @app.route('/web-data', methods=['POST'])
# def receive_web_data():
#     data = request.json
#     print("Received web operation data:", data)
#     return jsonify({"status": "success"})


def get_files(full_path, sort_by):
    items = []
    if os.path.isdir(full_path):
        items = os.listdir(full_path)
        items = [{"name": item, "is_dir": os.path.isdir(os.path.join(full_path, item)),
                  "extension": os.path.splitext(item)[1].lower(), } for item in items if not item.startswith(".")]

        # 根据排序方式排序
        if sort_by == "type":
            items.sort(key=lambda x: (not x["is_dir"], x["extension"], x["name"].lower()))
        else:
            items.sort(key=lambda x: x["name"].lower())
    return items


# file manager
# @app.route("/manager")
# def manager():
#     """主页，展示当前文件夹的内容"""
#     path = request.args.get("path", "")  # 获取当前的路径参数
#     sort_by = request.args.get("sort", "type")  # 默认按类型排序
#     view_mode = request.args.get("view", "grid")  # 默认网格视图
#     full_path = os.path.join(session['CURRENT_FOLDER'], path)
#
#     # 获取文件夹内容
#     items = get_files(full_path, sort_by)
#     return render_template("manager.html", items=items, current_path=path, sort_by=sort_by, view_mode=view_mode)
#
#
# @app.route("/all-surveys")
# def all_surveys():
#     """主页，展示所有调查问卷结果"""
#     path = request.args.get("path", "")  # 获取当前的路径参数
#     sort_by = request.args.get("sort", "type")  # 默认按类型排序
#     view_mode = request.args.get("view", "grid")  # 默认网格视图
#     full_path = os.path.join(RESULT_FOLDER, path)
#
#     # 获取文件夹内容
#     items = get_files(full_path, sort_by)
#     return render_template("all_surveys.html", items=items, current_path=path, sort_by=sort_by, view_mode=view_mode)


def render_file_manager(base_path, endpoint, request_args):
    """通用文件管理器渲染函数"""
    path = request_args.get("path", "")  # 获取当前的路径参数
    sort_by = request_args.get("sort", "type")  # 默认按类型排序
    view_mode = request_args.get("view", "grid")  # 默认网格视图
    full_path = os.path.join(base_path, path)

    # 假设 get_files 是您现有的文件夹解析函数
    items = get_files(full_path, sort_by)
    return render_template("manager.html",
                           items=items,
                           current_path=path,
                           sort_by=sort_by,
                           view_mode=view_mode,
                           endpoint=endpoint)


@app.route("/manager")
def manager():
    """主页，展示当前文件夹的内容"""
    return render_file_manager(session['CURRENT_FOLDER'], "manager", request.args)


@app.route("/allsurveys")
def allsurveys():
    """主页，展示所有调查问卷结果"""
    return render_file_manager(RESULT_FOLDER, "allsurveys", request.args)


@app.route("/download")
def download():
    """下载文件"""
    path = request.args.get("path", "")
    full_path = os.path.join(RESULT_FOLDER, path)

    if not os.path.exists(full_path) or os.path.isdir(full_path):
        return "File not found", 404

    return send_from_directory(RESULT_FOLDER, path, as_attachment=True)


# 下载结果文件
@app.route('/download_results', methods=['POST', 'GET'])
def download_results():
    type = request.args.get("type", "")
    path = request.args.get("path", "")

    if type == 'allsurveys':
        realpath = os.path.join(RESULT_FOLDER[:-1], path) if path != "" else RESULT_FOLDER[:-1]
    else:
        realpath = os.path.join(session['CURRENT_FOLDER'], path) if path != "" else session["CURRENT_FOLDER"]

    # 将当前目录中的static文件夹复制到realpath路径下，注意只复制static文件夹下的css、icon、images、reports、webfonts文件夹及其内部所有文件夹和文件。

    # zip_filepath = os.path.join(RESULT_FOLDER, os.path.join(root, path) + '.zip') if path != "" else os.path.join(RESULT_FOLDER, root + '.zip')
    # zip_filepath = os.path.join(RESULT_FOLDER, session['RESULT_FILENAME'] + '.zip')

    # from_static_path = os.path.join(os.getcwd(), "static")
    # to_static_path = os.path.join(realpath, "webpage", "static")
    # if not os.path.exists(to_static_path):
    #     os.makedirs(to_static_path)
    #
    # for folder in ["css", "icon", "images", "webfonts"]:
    #     src_path = os.path.join(from_static_path, folder)  # 原路径
    #     dst_path = os.path.join(to_static_path, folder)  # 目标路径
    #
    #     if os.path.exists(src_path):
    #         # 复制整个文件夹，包括子目录和文件
    #         shutil.copytree(src_path, dst_path, dirs_exist_ok=True)

    zip_file = realpath + f".zip"

    # 创建压缩文件
    shutil.make_archive(realpath, 'zip', realpath)
    sleep(1)

    # @after_this_request
    # def cleanup(response):
    #     # 删除压缩文件
    #     if os.path.exists(zip_file):
    #         sleep(3)
    #         os.remove(zip_file)
    #     return response

    # 将压缩文件发送到前端
    return send_file(zip_file, as_attachment=True, download_name=os.path.basename(zip_file))


@app.route("/view-jsonl")
def view_jsonl():
    """在线查看 JSON 文件内容"""
    path = request.args.get("path", "")
    full_path = os.path.join(session['CURRENT_FOLDER'], path)

    if not os.path.exists(full_path) or not full_path.endswith(".jsonl"):
        return "File not found or not a JSON Lines file", 404

    json_lines = []
    try:
        with open(full_path, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    json_lines.append(json.loads(line))  # 逐行解析 JSON 对象
                except json.JSONDecodeError:
                    return "Invalid JSON Lines format in file", 400
    except Exception as e:
        return f"Error reading file: {e}", 400

    # 渲染模板并传递逐行 JSON 内容
    return render_template("view_json.html", json_lines=json_lines)


@app.route("/generate-webpage", methods=["POST"])
def generate_webpage():
    data = request.json
    html_content = data.get("html")  # pagination-container

    if not html_content:
        return jsonify({"error": "No HTML content provided"}), 400

    # 将 /static/ 替换为服务器上的绝对路径
    # static_dir = os.path.abspath("static")
    # html_content = html_content.replace(
    #     "/static/", f"file://{static_dir}/"
    # )
    html_content = html_content.replace("/static/", f"static/")

    # 解析 HTML
    soup = BeautifulSoup(html_content, 'html.parser')

    # 获取当前操作系统类型
    os_type = platform.system()
    if os_type == "Windows":
        node_executable = os.path.join(os.path.dirname(__file__), "nodejs", "win", "node.exe")
    elif os_type == "Darwin":  # macOS 的平台标识
        node_executable = "node"
    else:
        raise EnvironmentError("Unsupported operating system!")

    # 处理所有script中的js代码
    for script_tag in soup.find_all('script'):
        # 检查 <script> 标签的 src 属性是否包含 "webgazer"
        if script_tag.get('src') and 'webgazer' in script_tag['src']:
            script_tag.decompose()  # 删除匹配的 <script> 标签

        if script_tag.string:
            # 调用 Node.js 脚本处理 JavaScript
            result = subprocess.run(
                [node_executable,
                 os.path.join(os.path.dirname(__file__), 'scripts/remove_unwanted.js')],  # Node.js 脚本路径
                input=script_tag.string,  # 将 <script> 内容作为输入
                text=True,  # 以文本形式传递
                capture_output=True,  # 捕获输出
                encoding="utf-8"
            )

            # 检查是否成功
            if result.returncode == 0:
                cleaned_js = result.stdout.strip()  # 获取修改后的 JavaScript
                script_tag.string.replace_with(cleaned_js)  # 替换 <script> 内容
            else:
                print(f"Error: {result.stderr.strip()}")  # 输出错误信息

    # 处理HTML元素，删除 <div> 标签中 id 包含 "webgazer"
    for div_tag in soup.find_all('div'):
        if div_tag.get('id') and 'webgazer' in div_tag['id']:
            div_tag.decompose()  # 删除匹配的 <div> 标签

    # 保存HTML
    html_path = os.path.join(session['WEBPAGE_PATH'], f'{data["index"]}.html')
    with open(html_path, "w", encoding="utf-8") as file:
        file.write(soup.prettify())

    # 保存元数据文件
    metadata_path = os.path.join(session['WEBPAGE_PATH'], f'{data["index"]}_metadata.json')
    metadata = {
        "htmlFile": f'{data["index"]}.html',  # 元数据中也可以记录对应的 HTML 文件名
        "windowWidth": data.get("windowWidth"),
        "windowHeight": data.get("windowHeight"),
    }
    with open(metadata_path, "w", encoding="utf-8") as file:
        json.dump(metadata, file, indent=4)

    return jsonify({"status": "success"})


@app.route("/view-image")
def view_image():
    """在线查看 PNG 图片"""
    path = request.args.get("path", "")
    full_path = os.path.join(session['CURRENT_FOLDER'], path)

    if not os.path.exists(full_path) or not full_path.endswith(".jpg"):
        return "File not found or not a JPEG file", 404

    return render_template("view_image.html", image_path=full_path.replace(BASE_DIR, ""))


@app.route('/update_status', methods=['POST'])
def update_status():
    """
    Handles requests from the frontend to perform pause or resume actions based on the 'action' parameter.
    """
    try:
        # Parse JSON data from the request
        data = request.json

        # Retrieve the action type ('pause' or 'resume')
        action = data.get('action', '').strip().lower()
        if not action:
            return jsonify({"error": "The 'action' parameter is missing."}), 400

        if action in ["pause", "resume", "start"]:
            # Log the action and additional data into the survey result file
            with open(session['SURVEY_RESULT_FILE'], 'a') as file:
                json.dump(data, file)
                file.write("\n")

            # Additional logic such as logging or database updates can be added here
            return jsonify({"status": "success", "action": action}), 200
        else:
            return jsonify({"error": "Invalid action. Accepted values are 'pause' or 'resume'."}), 400

    except Exception as e:
        # Capture exceptions and return an error response
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


@app.route('/end')
def end():
    """显示结束界面"""
    return render_template('end.html')


if __name__ == '__main__':
    # 设置命令行参数
    parser = argparse.ArgumentParser(description="Run Questionnaire Application")
    parser.add_argument('--debug', action='store_true', help="Debug mode")
    parser.add_argument('--port', type=int, default=5090, help="Port to run the application on")
    parser.add_argument('--interval', type=float, default=50, help="Gaze and mouse tracking interval (μs)")
    parser.add_argument('--videopreview', action='store_true', help="Enable video preview", default=False)

    args = parser.parse_args()

    # 输入材料路径
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    LABEL_PATH = os.path.join(BASE_DIR, 'static', 'reports', 'survey_data_clean.csv')

    # 输出路径
    RESULT_FOLDER = os.path.join(BASE_DIR, 'results', '')
    if not os.path.exists(RESULT_FOLDER):
        os.makedirs(RESULT_FOLDER)
    # 将 results 文件夹注册为静态文件夹
    app.add_url_rule('/results/<path:filename>', endpoint='results',
                     view_func=lambda filename: send_from_directory(RESULT_FOLDER, filename))

    # 加载数据
    labels_df = pd.read_csv(LABEL_PATH)
    image_reports = [
        {
            'index': index,
            'name': row.image_id,
            'image': f'images/{row.image_id}.png',
            'reports': [row.left, row.right]
        }
        for index, row in enumerate(labels_df.itertuples(index=False), start=1)
    ]
    if args.debug:
        image_reports = image_reports[:5]

    num_of_images = len(image_reports)

    app.run(host="localhost", debug=args.debug, port=args.port)
