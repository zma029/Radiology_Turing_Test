# Radiology Turing Test

This is a Flask-based web application designed for conducting surveys with integrated eye-tracking and mouse-tracking features.

---


## Folder Structure
```
project/
│
├── app.py                   # Main Flask application
├── templates/               # HTML templates for pages
│   ├── welcome.html         # Welcome page
│   ├── survey.html          # Survey page
│   ├── end.html             # End page
│   ├── manager.html         # Result manager page
│   └── view_json.html       # JSON viewer page
│
├── static/                  # Static assets
│   ├── css/                 # CSS files for styling
│   ├── js/                  # JavaScript files
│   └── images/              # Images used in the survey
│
├── results/                 # Survey result storage
└── scripts/                 # Auxiliary scripts
```
---

## Configuration

### Command-Line Arguments

| Argument         | Description                                 | Default Value |
|------------------|---------------------------------------------|---------------|
| `--debug`        | Enables debug mode.                        | `False`       |
| `--port`         | Specifies the port for the Flask server.   | `5090`        |
| `--interval`     | Interval for gaze and mouse tracking (µs). | `50`          |

### Example Command
```bash
conda create --name my_env python=3.9
conda activate my_env
pip install -r requirements.txt
```
```bash
python app.py --debug --port 5080 --interval 100
```

---

## Workflow

1. Starting the Survey
	* Go to the welcome page (/).
	* Enter the participant’s name and choose the survey type.
	* Begin the survey by submitting the form.
2. Calibration Process
	* Click on all the designated points to complete eye-tracking calibration.
3. Answering Questions
	* View the survey images and provide responses to the questions.
	* Eye-tracking and mouse-tracking data will be recorded automatically.
	* Submit your answers and move to the next question.
4. Finishing the Survey
	* After completing all the questions, you will be redirected to the completion page (/end).

---

## Survey Data Structure

### Data Storage
* Eye-Tracking Data: Saved as JSON files in the eye_tracking folder.
* Mouse-Tracking Data: Saved as JSON files in the mouse_tracking folder.
* Survey Responses: Stored in a single file named survey_result.json.
* Web Pages: Static HTML pages of all surveys are exported in the webpage folder.

### Directory Structure
```
results/
└── Participant_SurveyType_Timestamp/
    ├── eye_tracking/
    ├── mouse_tracking/
    ├── webpage/
    └── survey_result.json
```

---

## Dependencies

### Python Libraries
* Flask
* pandas
* BeautifulSoup (bs4)
* argparse
* shutil
* zipfile
* subprocess

### Front-End Libraries
* FontAwesome (for icons)
* jQuery (for interactions)

---

## Deployment Instructions

### Step 1: Package the Application as a Binary File

Use the following steps to create a standalone binary:

1. Install PyInstaller:
```bash
pip install pyinstaller
```

2. Package the application:
```bash
pyinstaller --onefile --add-data "templates:templates" --add-data "static:static" --add-data "results:results" --add-data "scripts:scripts" --add-data "nodejs:nodejs" --add-data "node_modules:node_modules" app.py 
```

### Step 2: Access the Application
1. Open the EXE file. 
2. Open a web browser and navigate to: http://localhost:5090

### Step 3: View Completed Surveys
• To view all previously completed surveys, go to: http://localhost:5090/allsurveys

---
## Download Surveys

Unzip tools/static.zip to downloaded survey webpage folder, then we can see full HTML.  

---

## 📄 License & Usage

This project is open-sourced under the [MIT License](./LICENSE).  
However, **commercial use is strictly prohibited**.

You are free to:
- Use, copy, and modify this project for **research, academic, personal, or educational purposes**
- Share and redistribute the code under the same non-commercial terms
- Cite or attribute this project in your work

### 📖 Citation

If you use this project in academic work, please cite it as:

```bibteex

@misc{gao2025awesome,
  author       = {Zhuoqi, Ma},
  title        = {Radiology Turing Test},
  year         = {2025},
  publisher    = {GitHub},
  howpublished = {\url{https://github.com/zma029/Radiology_Turing_Test}},
}
```

For commercial licensing inquiries, please contact: zhuoqi_ma@hotmail.com

For any questions or issues, feel free to reach out! 😊
