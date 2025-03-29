from flask import Flask, request, jsonify, render_template
import tensorflow as tf
import numpy as np
import pandas as pd
import joblib
import os

app = Flask(__name__)

model_path = 'model/nutrient_model.keras'
preprocessor_path = 'model/nutrient_preprocessor.pkl'
nutrient_columns_path = 'model/nutrient_columns.pkl'

if os.path.exists(model_path) and os.path.exists(preprocessor_path) and os.path.exists(nutrient_columns_path):
    model = tf.keras.models.load_model(model_path)
    preprocessor = joblib.load(preprocessor_path)
    nutrient_columns = joblib.load(nutrient_columns_path)
else:
    print("Warning: Model files not found. Using mock objects for demonstration.")
    
    class MockModel:
        def predict(self, X):
            return np.random.uniform(low=[0.8, 50, 600, 8], high=[2.0, 120, 1500, 25], size=(X.shape[0], 4))
    
    model = MockModel()
    preprocessor = None  
    nutrient_columns = ['Vitamin_A_mg', 'Vitamin_C_mg', 'Calcium_mg', 'Iron_mg']

def get_diet_feedback(nutrient_values, personal_data):
    
    vit_a, vit_c, calcium, iron = nutrient_values
    
    vit_a_range = (0.9, 1.8)  
    vit_c_range = (75, 90)
    calcium_range = (1000, 1300) 
    iron_range_male = (8, 11)     
    iron_range_female = (15, 18) 
    
    iron_range = iron_range_female if personal_data.get('Gender') == 'Female' else iron_range_male
    
    def calculate_score(value, min_val, max_val):
        if value < min_val:
            return max(0, 60 * (value / min_val))
        elif value > max_val * 1.5:
            return max(0, 100 - (value - max_val * 1.5) * 30 / max_val)
        elif value > max_val:
            return 90 - (value - max_val) * 30 / max_val
        else:
            normalized = (value - min_val) / (max_val - min_val)
            return 80 + 20 * (1 - abs(normalized - 0.5) * 2)
    
    # Calculate individual scores
    vit_a_score = calculate_score(vit_a, *vit_a_range)
    vit_c_score = calculate_score(vit_c, *vit_c_range)
    calcium_score = calculate_score(calcium, *calcium_range)
    iron_score = calculate_score(iron, *iron_range)
    
    overall_score = (vit_a_score + vit_c_score + calcium_score + iron_score) / 4
    
    if overall_score >= 85:
        diet_score = "Excellent"
        color = "green"
    elif overall_score >= 70:
        diet_score = "Good"
        color = "blue"
    elif overall_score >= 55:
        diet_score = "Average"
        color = "green"
    else:
        diet_score = "Poor"
        color = "red"
    
    feedback = {
        "score": overall_score,
        "category": diet_score,
        "color": color,
        "message": "",
        "detailed_feedback": []
    }
    
    nutrients_feedback = []
    
    if vit_a < vit_a_range[0]:
        nutrients_feedback.append({
            "nutrient": "Vitamin A",
            "value": vit_a,
            "status": "low",
            "message": "Your Vitamin A levels are low. Try incorporating more carrots, sweet potatoes, and leafy greens in your diet."
        })
    elif vit_a > vit_a_range[1] * 1.3:
        nutrients_feedback.append({
            "nutrient": "Vitamin A",
            "value": vit_a,
            "status": "high",
            "message": "Your Vitamin A intake is higher than recommended. Monitor consumption of supplements and vitamin A-rich foods."
        })
    else:
        nutrients_feedback.append({
            "nutrient": "Vitamin A",
            "value": vit_a,
            "status": "good",
            "message": "Your Vitamin A levels look good. Keep maintaining a balanced diet."
        })
    
    if vit_c < vit_c_range[0]:
        nutrients_feedback.append({
            "nutrient": "Vitamin C",
            "value": vit_c,
            "status": "low",
            "message": "Your Vitamin C levels are low. Try adding more citrus fruits, bell peppers, and berries to your meals."
        })
    else:
        nutrients_feedback.append({
            "nutrient": "Vitamin C",
            "value": vit_c,
            "status": "good",
            "message": "Your Vitamin C intake is adequate. Great job including fruits and vegetables in your diet!"
        })
    
    if calcium < calcium_range[0]:
        nutrients_feedback.append({
            "nutrient": "Calcium",
            "value": calcium,
            "status": "low",
            "message": "Your Calcium levels are low. Consider adding more dairy products, fortified plant milks, or leafy greens."
        })
    else:
        nutrients_feedback.append({
            "nutrient": "Calcium",
            "value": calcium,
            "status": "good",
            "message": "Your Calcium intake is sufficient for maintaining healthy bones and teeth."
        })
    
    if iron < iron_range[0]:
        nutrients_feedback.append({
            "nutrient": "Iron",
            "value": iron,
            "status": "low",
            "message": "Your Iron levels are lower than recommended. Try including more lean meats, beans, and leafy greens in your diet."
        })
    elif iron > iron_range[1] * 1.5:
        nutrients_feedback.append({
            "nutrient": "Iron",
            "value": iron,
            "status": "high",
            "message": "Your Iron intake is on the higher side. Consider consulting with a healthcare provider if you're taking supplements."
        })
    else:
        nutrients_feedback.append({
            "nutrient": "Iron",
            "value": iron,
            "status": "good",
            "message": "Your Iron levels are within a healthy range. Great job!"
        })
    
    feedback["detailed_feedback"] = nutrients_feedback
    
    if diet_score == "Excellent":
        feedback["message"] = "Congratulations! Your nutrient profile is excellent. You're on track for optimal health and wellness. Keep maintaining your balanced diet rich in essential nutrients."
    elif diet_score == "Good":
        feedback["message"] = "Your nutrient profile is good. With a few targeted improvements, you could reach excellent levels. Review the specific nutrient recommendations below."
    elif diet_score == "Average":
        feedback["message"] = "Your nutrient profile is average. While not concerning, there's room for improvement. Follow the recommendations below to boost your nutrition and overall health."
    else:
        feedback["message"] = "Your diet score needs attention. If you maintain this level, your health may be impacted over time. Consider making changes to your diet based on the recommendations below."
    
    if diet_score == "Poor":
        age = personal_data.get('Age', 30)
        activity = personal_data.get('Physical_Activity_Level', 'Moderate')
        
        if age > 50 and activity == 'Low':
            feedback["risk_message"] = "At your age and activity level, improving your nutrient intake is particularly important to maintain health and prevent chronic conditions."
        elif personal_data.get('Chronic_Disease') not in [None, 'None']:
            feedback["risk_message"] = f"With your {personal_data.get('Chronic_Disease')} condition, improving your nutrition is crucial for managing your health effectively."
        else:
            feedback["risk_message"] = "If you continue with this nutrient profile, you may experience decreased energy levels, weakened immunity, and increased health risks over time."
    
    return feedback

def predict_nutrients(personal_data):
    input_df = pd.DataFrame([personal_data])
    
    if preprocessor is None:
        processed_data = np.ones((1, 10)) 
    else:
        processed_data = preprocessor.transform(input_df)
    predictions = model.predict(processed_data)
    predictions = np.maximum(predictions, 0)
    predictions_list = predictions[0].tolist()
    
    results = {
        "predicted_nutrients": dict(zip(nutrient_columns, predictions_list)),
        "feedback": get_diet_feedback(predictions_list, personal_data)
    }
    
    return results

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    
    required_fields = ['Age', 'Gender', 'Weight_kg', 'Height_cm', 'Physical_Activity_Level']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    results = predict_nutrients(data)
    
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)