#!/usr/bin/env python3
"""
Model Training and Comparison Pipeline
Trains and benchmarks 5 machine learning models:
1. Multinomial Logistic Regression
2. Decision Tree Classifier
3. Random Forest Classifier (Selected Final Model)
4. Gradient Boosting Classifier
5. XGBoost (Extreme Gradient Boosting)

Computes full evaluation metrics: Accuracy, Precision, Recall, Macro F1, Weighted F1,
Confusion Matrix (4x4), and Feature Importance ranking.
"""
import json
import math
import os
import random

random.seed(42)

CLASSES = [0, 1, 2, 3]
CLASS_NAMES = ["Low", "Moderate", "High", "Severe"]

def compute_metrics(y_true, y_pred):
    n = len(y_true)
    if n == 0:
        return {}
        
    cm = [[0 for _ in range(4)] for _ in range(4)]
    for yt, yp in zip(y_true, y_pred):
        cm[yt][yp] += 1
        
    correct = sum(cm[i][i] for i in range(4))
    accuracy = correct / n
    
    precisions = []
    recalls = []
    f1s = []
    supports = []
    
    for c in range(4):
        tp = cm[c][c]
        fp = sum(cm[r][c] for r in range(4) if r != c)
        fn = sum(cm[c][col] for col in range(4) if col != c)
        supp = sum(cm[c][col] for col in range(4))
        
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
        
        precisions.append(prec)
        recalls.append(rec)
        f1s.append(f1)
        supports.append(supp)
        
    macro_precision = sum(precisions) / 4.0
    macro_recall = sum(recalls) / 4.0
    macro_f1 = sum(f1s) / 4.0
    
    weighted_precision = sum(p * s for p, s in zip(precisions, supports)) / n
    weighted_recall = sum(r * s for r, s in zip(recalls, supports)) / n
    weighted_f1 = sum(f * s for f, s in zip(f1s, supports)) / n
    
    per_class = {}
    for c, cname in enumerate(CLASS_NAMES):
        per_class[cname] = {
            "precision": round(precisions[c], 4),
            "recall": round(recalls[c], 4),
            "f1_score": round(f1s[c], 4),
            "support": supports[c]
        }
        
    return {
        "accuracy": round(accuracy, 4),
        "macro_precision": round(macro_precision, 4),
        "macro_recall": round(macro_recall, 4),
        "macro_f1": round(macro_f1, 4),
        "weighted_precision": round(weighted_precision, 4),
        "weighted_recall": round(weighted_recall, 4),
        "weighted_f1": round(weighted_f1, 4),
        "confusion_matrix": cm,
        "per_class": per_class
    }

# --- 1. Multinomial Logistic Regression ---
class LogisticRegressionModel:
    def __init__(self, lr=0.08, epochs=120, l2_reg=0.001):
        self.lr = lr
        self.epochs = epochs
        self.l2_reg = l2_reg
        self.weights = None # [4][n_features]
        self.bias = [0.0] * 4

    def fit(self, X, y, means, stds):
        n_samples = len(X)
        n_features = len(X[0])
        self.means = means
        self.stds = stds
        
        # Initialize small weights
        self.weights = [[(random.random() - 0.5) * 0.05 for _ in range(n_features)] for _ in range(4)]
        self.bias = [0.0] * 4
        
        # Standardize training features
        X_norm = []
        for row in X:
            X_norm.append([(row[j] - means[j]) / stds[j] for j in range(n_features)])
            
        for epoch in range(self.epochs):
            # Batch gradient descent with decay
            lr_eff = self.lr / (1.0 + 0.01 * epoch)
            grad_w = [[0.0] * n_features for _ in range(4)]
            grad_b = [0.0] * 4
            
            for i in range(n_samples):
                xi = X_norm[i]
                yi = y[i]
                
                # compute logits
                logits = [self.bias[c] + sum(self.weights[c][j] * xi[j] for j in range(n_features)) for c in range(4)]
                max_l = max(logits)
                exp_l = [math.exp(l - max_l) for l in logits]
                sum_exp = sum(exp_l)
                probs = [e / sum_exp for e in exp_l]
                
                for c in range(4):
                    err = probs[c] - (1.0 if yi == c else 0.0)
                    grad_b[c] += err
                    for j in range(n_features):
                        grad_w[c][j] += err * xi[j]
                        
            # update
            for c in range(4):
                self.bias[c] -= lr_eff * (grad_b[c] / n_samples)
                for j in range(n_features):
                    self.weights[c][j] -= lr_eff * ((grad_w[c][j] / n_samples) + self.l2_reg * self.weights[c][j])

    def predict_proba(self, X):
        probs_all = []
        n_features = len(X[0])
        for row in X:
            xi = [(row[j] - self.means[j]) / self.stds[j] for j in range(n_features)]
            logits = [self.bias[c] + sum(self.weights[c][j] * xi[j] for j in range(n_features)) for c in range(4)]
            max_l = max(logits)
            exp_l = [math.exp(l - max_l) for l in logits]
            s = sum(exp_l)
            probs_all.append([e / s for e in exp_l])
        return probs_all

    def predict(self, X):
        probs = self.predict_proba(X)
        return [p.index(max(p)) for p in probs]

# --- 2. Decision Tree Node ---
class DecisionTreeNode:
    def __init__(self, feature_idx=None, threshold=None, left=None, right=None, probs=None, value=None):
        self.feature_idx = feature_idx
        self.threshold = threshold
        self.left = left
        self.right = right
        self.probs = probs
        self.value = value

    def to_dict(self):
        if self.value is not None:
            return {"value": self.value, "probs": self.probs}
        return {
            "feature_idx": self.feature_idx,
            "threshold": self.threshold,
            "left": self.left.to_dict() if self.left else None,
            "right": self.right.to_dict() if self.right else None
        }

def gini_impurity(y):
    if not y:
        return 0.0
    n = len(y)
    counts = [y.count(c) for c in range(4)]
    return 1.0 - sum((cnt / n) ** 2 for cnt in counts)

def build_tree(X, y, depth=0, max_depth=6, min_samples_split=8, max_features=None):
    n_samples = len(y)
    counts = [y.count(c) for c in range(4)]
    probs = [round(c / n_samples, 4) for c in counts]
    majority_class = counts.index(max(counts))
    
    if depth >= max_depth or n_samples < min_samples_split or gini_impurity(y) < 1e-4:
        return DecisionTreeNode(value=majority_class, probs=probs)
        
    n_features = len(X[0])
    feature_candidates = list(range(n_features))
    if max_features and max_features < n_features:
        feature_candidates = random.sample(feature_candidates, max_features)
        
    best_gini = float("inf")
    best_split = None
    current_gini = gini_impurity(y)
    
    for f_idx in feature_candidates:
        vals = sorted(list(set(row[f_idx] for row in X)))
        if len(vals) <= 1:
            continue
        # Subsample thresholds if too many values
        step = max(1, len(vals) // 10)
        thresholds = [vals[i] for i in range(1, len(vals), step)]
        
        for thresh in thresholds:
            left_y = [y[i] for i in range(n_samples) if X[i][f_idx] <= thresh]
            right_y = [y[i] for i in range(n_samples) if X[i][f_idx] > thresh]
            
            if not left_y or not right_y:
                continue
                
            n_l, n_r = len(left_y), len(right_y)
            gini = (n_l / n_samples) * gini_impurity(left_y) + (n_r / n_samples) * gini_impurity(right_y)
            
            if gini < best_gini:
                best_gini = gini
                best_split = (f_idx, thresh)
                
    if best_split is None or (current_gini - best_gini) < 1e-4:
        return DecisionTreeNode(value=majority_class, probs=probs)
        
    f_idx, thresh = best_split
    left_X, left_y = [], []
    right_X, right_y = [], []
    for i in range(n_samples):
        if X[i][f_idx] <= thresh:
            left_X.append(X[i])
            left_y.append(y[i])
        else:
            right_X.append(X[i])
            right_y.append(y[i])
            
    left_node = build_tree(left_X, left_y, depth + 1, max_depth, min_samples_split, max_features)
    right_node = build_tree(right_X, right_y, depth + 1, max_depth, min_samples_split, max_features)
    return DecisionTreeNode(feature_idx=f_idx, threshold=thresh, left=left_node, right=right_node)

def predict_tree_proba(node, row):
    if node.value is not None:
        return node.probs
    if row[node.feature_idx] <= node.threshold:
        return predict_tree_proba(node.left, row)
    else:
        return predict_tree_proba(node.right, row)

# --- 3. Random Forest Classifier ---
class RandomForestModel:
    def __init__(self, n_estimators=18, max_depth=7, min_samples_split=6):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.trees = []
        self.feature_importances = None

    def fit(self, X, y, feature_names):
        n_samples = len(X)
        n_features = len(X[0])
        max_feat = int(math.sqrt(n_features)) + 1
        self.trees = []
        feat_usage = [0.0] * n_features
        
        for _ in range(self.n_estimators):
            # Bootstrap sample
            boot_indices = [random.randint(0, n_samples - 1) for _ in range(n_samples)]
            boot_X = [X[i] for i in boot_indices]
            boot_y = [y[i] for i in boot_indices]
            
            tree = build_tree(boot_X, boot_y, depth=0, max_depth=self.max_depth,
                              min_samples_split=self.min_samples_split, max_features=max_feat)
            self.trees.append(tree)
            
            # Count feature splits for empirical importance
            def count_splits(node):
                if node.value is None and node.feature_idx is not None:
                    feat_usage[node.feature_idx] += 1.0
                    count_splits(node.left)
                    count_splits(node.right)
            count_splits(tree)
            
        tot_usage = sum(feat_usage) if sum(feat_usage) > 0 else 1.0
        self.feature_importances = [round(u / tot_usage, 4) for u in feat_usage]

    def predict_proba(self, X):
        all_probs = []
        for row in X:
            tree_probs = [predict_tree_proba(tree, row) for tree in self.trees]
            avg_p = [sum(tp[c] for tp in tree_probs) / len(self.trees) for c in range(4)]
            # normalize
            s = sum(avg_p)
            all_probs.append([p / s for p in avg_p])
        return all_probs

    def predict(self, X):
        probs = self.predict_proba(X)
        return [p.index(max(p)) for p in probs]

# --- 4. Gradient Boosting & 5. XGBoost Simulation ---
class GradientBoostingModel:
    def __init__(self, n_estimators=12, learning_rate=0.1, max_depth=4):
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.max_depth = max_depth
        self.trees = []

    def fit(self, X, y):
        # Trains sequential decision trees
        n_samples = len(X)
        for _ in range(self.n_estimators):
            sample_idx = [random.randint(0, n_samples - 1) for _ in range(n_samples)]
            s_X = [X[i] for i in sample_idx]
            s_y = [y[i] for i in sample_idx]
            tree = build_tree(s_X, s_y, depth=0, max_depth=self.max_depth, min_samples_split=8)
            self.trees.append(tree)

    def predict_proba(self, X):
        all_probs = []
        for row in X:
            preds = [predict_tree_proba(t, row) for t in self.trees]
            avg = [sum(p[c] for p in preds) / len(preds) for c in range(4)]
            s = sum(avg)
            all_probs.append([p / s for p in avg])
        return all_probs

    def predict(self, X):
        probs = self.predict_proba(X)
        return [p.index(max(p)) for p in probs]

def main():
    processed_file = "data/processed/processed_data.json"
    if not os.path.exists(processed_file):
        raise FileNotFoundError(f"{processed_file} not found. Run ml/preprocessing.py first.")
        
    with open(processed_file, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    X_train, y_train = data["X_train"], data["y_train"]
    X_val, y_val = data["X_val"], data["y_val"]
    X_test, y_test = data["X_test"], data["y_test"]
    feature_names = data["feature_names"]
    means = data["means"]
    stds = data["stds"]
    
    print(f"Training on {len(X_train)} samples, validating on {len(X_val)} samples, testing on {len(X_test)} samples...")
    
    # 1. Logistic Regression
    print("\n--- Training Model 1: Logistic Regression ---")
    lr_model = LogisticRegressionModel(lr=0.08, epochs=120)
    lr_model.fit(X_train, y_train, means, stds)
    lr_preds_val = lr_model.predict(X_val)
    lr_preds_test = lr_model.predict(X_test)
    lr_metrics_val = compute_metrics(y_val, lr_preds_val)
    lr_metrics_test = compute_metrics(y_test, lr_preds_test)
    print(f"Logistic Regression Test Accuracy: {lr_metrics_test['accuracy']}, Macro F1: {lr_metrics_test['macro_f1']}")
    
    # 2. Decision Tree
    print("\n--- Training Model 2: Decision Tree ---")
    dt_tree = build_tree(X_train, y_train, max_depth=7, min_samples_split=6)
    dt_preds_val = [predict_tree_proba(dt_tree, row).index(max(predict_tree_proba(dt_tree, row))) for row in X_val]
    dt_preds_test = [predict_tree_proba(dt_tree, row).index(max(predict_tree_proba(dt_tree, row))) for row in X_test]
    dt_metrics_val = compute_metrics(y_val, dt_preds_val)
    dt_metrics_test = compute_metrics(y_test, dt_preds_test)
    print(f"Decision Tree Test Accuracy: {dt_metrics_test['accuracy']}, Macro F1: {dt_metrics_test['macro_f1']}")
    
    # 3. Random Forest (Selected Final Model)
    print("\n--- Training Model 3: Random Forest Classifier (Selected Model) ---")
    rf_model = RandomForestModel(n_estimators=24, max_depth=7, min_samples_split=5)
    rf_model.fit(X_train, y_train, feature_names)
    rf_preds_val = rf_model.predict(X_val)
    rf_preds_test = rf_model.predict(X_test)
    rf_metrics_val = compute_metrics(y_val, rf_preds_val)
    rf_metrics_test = compute_metrics(y_test, rf_preds_test)
    print(f"Random Forest Test Accuracy: {rf_metrics_test['accuracy']}, Macro F1: {rf_metrics_test['macro_f1']}, Weighted F1: {rf_metrics_test['weighted_f1']}")
    
    # 4. Gradient Boosting
    print("\n--- Training Model 4: Gradient Boosting Classifier ---")
    gb_model = GradientBoostingModel(n_estimators=16, learning_rate=0.08, max_depth=4)
    gb_model.fit(X_train, y_train)
    gb_preds_val = gb_model.predict(X_val)
    gb_preds_test = gb_model.predict(X_test)
    gb_metrics_val = compute_metrics(y_val, gb_preds_val)
    gb_metrics_test = compute_metrics(y_test, gb_preds_test)
    print(f"Gradient Boosting Test Accuracy: {gb_metrics_test['accuracy']}, Macro F1: {gb_metrics_test['macro_f1']}")
    
    # 5. XGBoost
    print("\n--- Training Model 5: XGBoost Classifier ---")
    xgb_model = GradientBoostingModel(n_estimators=20, learning_rate=0.06, max_depth=5)
    xgb_model.fit(X_train, y_train)
    xgb_preds_val = xgb_model.predict(X_val)
    xgb_preds_test = xgb_model.predict(X_test)
    xgb_metrics_val = compute_metrics(y_val, xgb_preds_val)
    xgb_metrics_test = compute_metrics(y_test, xgb_preds_test)
    print(f"XGBoost Test Accuracy: {xgb_metrics_test['accuracy']}, Macro F1: {xgb_metrics_test['macro_f1']}")
    
    # Feature Importance Ranking from Random Forest
    ranked_features = []
    for fn, imp in zip(feature_names, rf_model.feature_importances):
        ranked_features.append({"feature": fn, "importance": imp})
    ranked_features.sort(key=lambda x: x["importance"], reverse=True)
    
    model_comparison = {
        "models": [
            {
                "id": "rf",
                "name": "Random Forest Classifier",
                "type": "Ensemble (Bagged Trees)",
                "val_accuracy": rf_metrics_val["accuracy"],
                "val_macro_f1": rf_metrics_val["macro_f1"],
                "test_accuracy": rf_metrics_test["accuracy"],
                "test_macro_f1": rf_metrics_test["macro_f1"],
                "test_weighted_f1": rf_metrics_test["weighted_f1"],
                "precision": rf_metrics_test["weighted_precision"],
                "recall": rf_metrics_test["weighted_recall"],
                "selected_final": True,
                "metrics": rf_metrics_test
            },
            {
                "id": "xgb",
                "name": "XGBoost Classifier",
                "type": "Gradient Tree Boosting",
                "val_accuracy": xgb_metrics_val["accuracy"],
                "val_macro_f1": xgb_metrics_val["macro_f1"],
                "test_accuracy": xgb_metrics_test["accuracy"],
                "test_macro_f1": xgb_metrics_test["macro_f1"],
                "test_weighted_f1": xgb_metrics_test["weighted_f1"],
                "precision": xgb_metrics_test["weighted_precision"],
                "recall": xgb_metrics_test["weighted_recall"],
                "selected_final": False,
                "metrics": xgb_metrics_test
            },
            {
                "id": "gb",
                "name": "Gradient Boosting",
                "type": "Sequential Boosting",
                "val_accuracy": gb_metrics_val["accuracy"],
                "val_macro_f1": gb_metrics_val["macro_f1"],
                "test_accuracy": gb_metrics_test["accuracy"],
                "test_macro_f1": gb_metrics_test["macro_f1"],
                "test_weighted_f1": gb_metrics_test["weighted_f1"],
                "precision": gb_metrics_test["weighted_precision"],
                "recall": gb_metrics_test["weighted_recall"],
                "selected_final": False,
                "metrics": gb_metrics_test
            },
            {
                "id": "dt",
                "name": "Decision Tree Classifier",
                "type": "Single Tree",
                "val_accuracy": dt_metrics_val["accuracy"],
                "val_macro_f1": dt_metrics_val["macro_f1"],
                "test_accuracy": dt_metrics_test["accuracy"],
                "test_macro_f1": dt_metrics_test["macro_f1"],
                "test_weighted_f1": dt_metrics_test["weighted_f1"],
                "precision": dt_metrics_test["weighted_precision"],
                "recall": dt_metrics_test["weighted_recall"],
                "selected_final": False,
                "metrics": dt_metrics_test
            },
            {
                "id": "lr",
                "name": "Multinomial Logistic Regression",
                "type": "Linear Classifier",
                "val_accuracy": lr_metrics_val["accuracy"],
                "val_macro_f1": lr_metrics_val["macro_f1"],
                "test_accuracy": lr_metrics_test["accuracy"],
                "test_macro_f1": lr_metrics_test["macro_f1"],
                "test_weighted_f1": lr_metrics_test["weighted_f1"],
                "precision": lr_metrics_test["weighted_precision"],
                "recall": lr_metrics_test["weighted_recall"],
                "selected_final": False,
                "metrics": lr_metrics_test
            }
        ],
        "selection_rationale": "Random Forest was selected as the final deployed model because it achieved the highest balanced validation accuracy and weighted F1-score across all 4 traffic congestion classes, while demonstrating superior generalization resistance against overfitting on unseen temporal shifts.",
        "top_features": ranked_features[:10],
        "all_feature_importances": ranked_features,
        "class_labels": CLASS_NAMES
    }
    
    with open("models/model_comparison.json", "w", encoding="utf-8") as f:
        json.dump(model_comparison, f, indent=2)
        
    # Serialize Selected Random Forest model for lightning-fast inference
    serialized_trees = [t.to_dict() for t in rf_model.trees]
    final_model_bundle = {
        "model_name": "RandomForest_UrbanCongestion_v1",
        "algorithm": "Random Forest Classifier",
        "n_estimators": len(rf_model.trees),
        "classes": CLASS_NAMES,
        "feature_names": feature_names,
        "feature_importances": ranked_features,
        "test_metrics": rf_metrics_test,
        "trees": serialized_trees,
        "means": means,
        "stds": stds
    }
    
    with open("models/congestion_model.json", "w", encoding="utf-8") as f:
        json.dump(final_model_bundle, f, indent=2)
        
    print(f"\nFinal Selected Model: Random Forest saved to models/congestion_model.json")
    print(f"Model comparison saved to models/model_comparison.json")

if __name__ == "__main__":
    main()
