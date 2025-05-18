import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import os
import json
import logging
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import pickle

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add safe globals for torch serialization
torch.serialization.add_safe_globals(['sklearn.preprocessing._data.StandardScaler'])

class RoutePredictor(nn.Module):
    """
    Enhanced route prediction model that incorporates obstacle features
    
    Input features:
    - origin_lat, origin_lng: Origin coordinates
    - dest_lat, dest_lng: Destination coordinates
    - avoid_tolls: Whether to avoid toll roads (0 or 1)
    - avoid_highways: Whether to avoid highways (0 or 1)
    - avoid_floods: Whether to avoid flood-prone areas (0 or 1)
    - avoid_debris: Whether to avoid debris-prone areas (0 or 1)
    
    Output:
    - path_cost: Predicted path cost/distance
    - path_safety: Predicted path safety score
    """
    def __init__(self, input_size=8, hidden_size=64, output_size=2):
        super(RoutePredictor, self).__init__()
        self.model = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.ReLU(),
            nn.Dropout(0.2),  # Add dropout for regularization
            nn.Linear(hidden_size, hidden_size),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_size, output_size)
        )
    
    def forward(self, x):
        return self.model(x)

def load_data(data_dir):
    """Load processed feature data"""
    try:
        X = np.load(os.path.join(data_dir, 'features.npy'))
        y = np.load(os.path.join(data_dir, 'labels.npy'))
        
        # Create a new scaler instead of loading the saved one
        logger.info("Creating new scaler")
        scaler = StandardScaler()
        X = scaler.fit_transform(X)
        
        logger.info(f"Loaded {X.shape[0]} samples with {X.shape[1]} features")
        return X, y, scaler
    
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        return None, None, None

def train_model(X, y, scaler, output_dir, epochs=100, batch_size=32, lr=0.001):
    """Train the route prediction model"""
    # Split data into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Convert to PyTorch tensors
    X_train = torch.tensor(X_train, dtype=torch.float32)
    y_train = torch.tensor(y_train, dtype=torch.float32)
    X_test = torch.tensor(X_test, dtype=torch.float32)
    y_test = torch.tensor(y_test, dtype=torch.float32)
    
    # Create model
    input_size = X_train.shape[1]
    model = RoutePredictor(input_size=input_size)
    
    # Define loss function and optimizer
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    
    # Training loop
    train_losses = []
    test_losses = []
    
    for epoch in range(epochs):
        # Training
        model.train()
        total_loss = 0
        
        # Process in batches
        for i in range(0, len(X_train), batch_size):
            batch_X = X_train[i:i+batch_size]
            batch_y = y_train[i:i+batch_size]
            
            # Forward pass
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            
            # Backward pass and optimize
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
        
        avg_train_loss = total_loss / (len(X_train) / batch_size)
        train_losses.append(avg_train_loss)
        
        # Evaluation
        model.eval()
        with torch.no_grad():
            test_outputs = model(X_test)
            test_loss = criterion(test_outputs, y_test).item()
            test_losses.append(test_loss)
        
        # Log progress
        if (epoch + 1) % 10 == 0:
            logger.info(f"Epoch {epoch+1}/{epochs}, Train Loss: {avg_train_loss:.4f}, Test Loss: {test_loss:.4f}")
    
    # Save model and scaler
    os.makedirs(output_dir, exist_ok=True)
    
    # Save model without scaler in state dict
    model_path = os.path.join(output_dir, 'route_predictor_model.pth')
    torch.save({
        'model_state_dict': model.state_dict(),
        'input_size': input_size,
        'hidden_size': 64,
        'output_size': 2
    }, model_path)
    
    # Save scaler separately using pickle
    scaler_path = os.path.join(output_dir, 'scaler.pkl')
    with open(scaler_path, 'wb') as f:
        pickle.dump(scaler, f)
    
    # Also save as best_model.pth for compatibility
    best_model_path = os.path.join(output_dir, 'best_model.pth')
    torch.save({
        'model_state_dict': model.state_dict(),
        'input_size': input_size,
        'hidden_size': 64,
        'output_size': 2
    }, best_model_path)
    
    logger.info(f"Model saved to {model_path} and {best_model_path}")
    logger.info(f"Scaler saved to {scaler_path}")
    
    # Plot training and test loss
    plt.figure(figsize=(10, 5))
    plt.plot(train_losses, label='Training Loss')
    plt.plot(test_losses, label='Testing Loss')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.title('Training and Testing Loss')
    plt.legend()
    plt.savefig(os.path.join(output_dir, 'training_loss.png'))
    
    return model, train_losses, test_losses

def evaluate_model(model, X_test, y_test):
    """Evaluate the trained model"""
    model.eval()
    with torch.no_grad():
        X_test_tensor = torch.tensor(X_test, dtype=torch.float32)
        y_test_tensor = torch.tensor(y_test, dtype=torch.float32)
        
        # Get predictions
        y_pred = model(X_test_tensor)
        
        # Calculate MSE
        mse = nn.MSELoss()(y_pred, y_test_tensor).item()
        
        # Calculate R^2 score
        y_mean = torch.mean(y_test_tensor, dim=0)
        ss_tot = torch.sum((y_test_tensor - y_mean) ** 2, dim=0)
        ss_res = torch.sum((y_test_tensor - y_pred) ** 2, dim=0)
        r2 = 1 - ss_res / ss_tot
        
        logger.info(f"Model Evaluation - MSE: {mse:.4f}, R^2 (distance): {r2[0]:.4f}, R^2 (safety): {r2[1]:.4f}")
        
        return mse, r2.numpy()

if __name__ == "__main__":
    # Paths
    data_dir = "data/processed"
    output_dir = "data"
    
    # Load data
    X, y, scaler = load_data(data_dir)
    
    if X is not None and y is not None:
        # Train model
        model, train_losses, test_losses = train_model(X, y, scaler, output_dir)
        
        # Split data for evaluation
        _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Evaluate model
        mse, r2 = evaluate_model(model, X_test, y_test)
