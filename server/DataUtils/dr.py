from sklearn.manifold import MDS, TSNE, LocallyLinearEmbedding
from sklearn.decomposition import PCA, KernelPCA
from sklearn.preprocessing import StandardScaler

# import umap
import math
import numpy as np


def scatter_plot(X, method="tsne"):
    X = np.array(X)
    scaler = StandardScaler().fit(X)
    estimator = None
    X = scaler.transform(X)
    if method == "pca":
        XY = PCA(n_components=2).fit_transform(X)
    if method == "kernel_pca":
        estimator = KernelPCA(n_components=2, kernel="cosine").fit(X)
        XY = estimator.transform(X)
    if method == "tsne":
        XY = TSNE(
            n_components=2,
            learning_rate="auto",
            init="random",
            perplexity=min(50, math.ceil(X.shape[0] / 2)),
            metric="cosine",
        ).fit_transform(X)
    # if method == "umap":
    #     reducer = umap.UMAP()
    #     XY = reducer.fit_transform(X)
    if method == "mds":
        XY = MDS(n_components=2).fit_transform(X)
    init_positions = XY
    XY, min_val, max_val = min_max_normalize(XY)
    # return XY
    return XY, estimator, scaler, min_val, max_val, init_positions


def init_kpca_reducer(X):
    X = np.array(X)
    scaler = StandardScaler().fit(X)
    X = scaler.transform(X)
    estimator = KernelPCA(n_components=2, kernel="cosine").fit(X)
    XY = estimator.transform(X)
    XY, min_val, max_val = min_max_normalize(XY)
    return {
        "scaler": scaler,
        "estimator": estimator,
        "min_val": min_val,
        "max_val": max_val,
    }


def reapply_dr(X, scaler, estimator, min_val, max_val):
    X = np.array(X)
    X = scaler.transform(X)
    XY = estimator.transform(X)
    XY, _, _ = min_max_normalize(XY, min_val, max_val)
    return XY


def getEquidistantPoints(p1, p2, parts):
    return zip(*[np.linspace(p1[i], p2[i], parts + 1) for i in range(len(p1))])


def min_max_normalize(data, min_vals=None, max_vals=None):
    if min_vals is None:
        min_vals = np.min(data, axis=0)
    if max_vals is None:
        max_vals = np.max(data, axis=0)

    normalized_data = np.clip(
        (data - min_vals) / (max_vals - min_vals), a_min=0, a_max=1
    )

    return normalized_data, min_vals, max_vals
