import torch
import torch.nn as nn
import torch.optim as optim
import pandas as pd
from astar import astar_search
from graph_builder import build_graph

class RoutePredictor(nn.Module):
    def __init__(self, num_nodes, emb_dim=16):
        super().__init__()
        self.embed = nn.Embedding(num_nodes, emb_dim)
        self.fc = nn.Linear(emb_dim*2, num_nodes)

    def forward(self, curr, dest):
        e1 = self.embed(curr)
        e2 = self.embed(dest)
        return self.fc(torch.cat([e1, e2], dim=1))

def train(raw_data, origin_idx, dest_idx, epochs=5):
    G = build_graph(raw_data)
    path = astar_search(G, origin_idx, dest_idx)
    # Prepare dataset of (curr, dest) → next
    data = [(path[i], path[i+1]) for i in range(len(path)-1)]
    df = pd.DataFrame(data, columns=['curr','next'])
    idx_map = {n:i for i,n in enumerate(sorted(G.nodes()))}
    inv_map = {v:k for k,v in idx_map.items()}

    inputs = torch.tensor([idx_map[c] for c in df['curr']])
    dests  = torch.tensor([idx_map[dest_idx]] * len(df))
    labels = torch.tensor([idx_map[n] for n in df['next']])

    model = RoutePredictor(len(idx_map))
    opt = optim.Adam(model.parameters())
    loss_fn = nn.CrossEntropyLoss()

    for ep in range(epochs):
        opt.zero_grad()
        out = model(inputs, dests)
        loss = loss_fn(out, labels)
        loss.backward(); opt.step()
        print(f"Epoch {ep+1}/{epochs} Loss: {loss.item():.4f}")

    torch.save({'state': model.state_dict(), 'idx_map': idx_map}, 'route_model.pt')
