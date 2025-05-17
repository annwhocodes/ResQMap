# ResQMap: Edge AI for Rescue Routing

## Overview
ResQMap computes optimal rescue routes in disaster zones using:

- **A\*** pathfinding on-device  
- **ML-based** alternative route prediction (pre-trained model)

## Setup
1. Clone this repo  
2. Download `route_model.pt` (place in project root)  
3. Create and activate a virtualenv  
4. `pip install -r requirements.txt`  
5. Copy your SerpAPI key into `.env`  
6. `streamlit run app.py`

## Usage
- Enter origin & destination  
- Choose **A\*** or **ML** mode  
- Hit **Compute Route** and view results on the map  

## Future Work
- Reinforcement Learning to refine routes  
- Real-time hazard overlays