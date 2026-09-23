#!/usr/bin/env python3
"""
Model Evaluation and Verification Script
Evaluates the saved Random Forest model on the hold-out test set
and displays full classification report and confusion matrix.
"""
import json
import os
import sys

def predict_node(node, row):
    if "value" in node and node["value"] is not None:
        return node["probs"]
    if row[node["feature_idx"]] <= node["threshold"]:
        return predict_node(node["left"], row)
    else:
        return predict_node(node["right"], row)

def evaluate_model():
    model_path = "models/congestion_model.json"
    data_path = "data/processed/processed_data.json"
    
    if not os.path.exists(model_path) or not os.path.exists(data_path):
        print("Required artifacts not found. Please run train.py first.")
        sys.exit(1)
        
    with open(model_path, "r", encoding="utf-8") as f:
        model = json.load(f)
        
    with open(data_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    X_test = data["X_test"]
    y_test = data["y_test"]
    classes = model["classes"]
    
    y_preds = []
    for row in X_test:
        tree_probs = [predict_node(t, row) for t in model["trees"]]
        avg_p = [sum(tp[c] for tp in tree_probs) / len(model["trees"]) for c in range(4)]
        y_preds.append(avg_p.index(max(avg_p)))
        
    # Confusion matrix
    cm = [[0 for _ in range(4)] for _ in range(4)]
    for yt, yp in zip(y_test, y_preds):
        cm[yt][yp] += 1
        
    total = len(y_test)
    correct = sum(cm[i][i] for i in range(4))
    acc = correct / total
    
    print("=" * 60)
    print("ACADEMIC MODEL EVALUATION REPORT")
    print("=" * 60)
    print(f"Model: {model['model_name']} ({model['algorithm']})")
    print(f"Hold-out Test Set Samples: {total}")
    print(f"Overall Accuracy: {acc * 100:.2f}%\n")
    
    print(f"{'Class':<12} {'Precision':<12} {'Recall':<12} {'F1-Score':<12} {'Support':<8}")
    print("-" * 58)
    for c, cname in enumerate(classes):
        tp = cm[c][c]
        fp = sum(cm[r][c] for r in range(4) if r != c)
        fn = sum(cm[c][col] for col in range(4) if col != c)
        supp = sum(cm[c][col] for col in range(4))
        p = tp / (tp + fp) if (tp + fp) > 0 else 0
        r = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = (2 * p * r) / (p + r) if (p + r) > 0 else 0
        print(f"{cname:<12} {p:<12.4f} {r:<12.4f} {f1:<12.4f} {supp:<8}")
        
    print("\nConfusion Matrix (Rows: Actual, Columns: Predicted):")
    print(f"{'':<10} {'Low':<8} {'Moderate':<10} {'High':<8} {'Severe':<8}")
    for c, cname in enumerate(classes):
        print(f"{cname:<10} {cm[c][0]:<8} {cm[c][1]:<10} {cm[c][2]:<8} {cm[c][3]:<8}")
    print("=" * 60)

if __name__ == "__main__":
    evaluate_model()
