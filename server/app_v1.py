import glob
from flask import Flask, request
from flask_cors import CORS
import json
# from .DataUtils import dr
import DataUtils as DataUtils
from functools import cmp_to_key
from collections import defaultdict
from numpy import dot
from numpy.linalg import norm
import numpy as np

app = Flask(__name__)
CORS(app)
# openai_api_key = open("api_key").read()
# document_controller = DocumentController(r'../data/result/chunk_embeddings/1103/all_chunks.json', openai_api_key)
def normalize_weight(links):
    def sigmoid(x): 
        return 1/(1 + pow(2.71828, -x))
    def min_max_norm(x, min, max):
        return (x - min) / (max - min)
    max_weight = 0
    min_weight = 100
    avg_weight = 0
    for link in links:
        max_weight = max(max_weight, link[2])
        min_weight = min(min_weight, link[2])
        avg_weight += link[2]
    avg_weight /= len(links)

    for link in links:
        link[2] = min_max_norm(link[2] - avg_weight, min_weight - avg_weight, max_weight - avg_weight)
    return links
def cosine_similarity(a, b):
    return dot(a, b)/(norm(a)*norm(b))
def chunk_cosine_similarity(chunk_embeddings):
    chunk_links = []
    for i in range(len(chunk_embeddings)):
        for j in range(i+1, len(chunk_embeddings)):
            chunk_1 = chunk_embeddings[i]
            chunk_2 = chunk_embeddings[j]
            v1 = np.array(chunk_1['embedding'])
            v2 = np.array(chunk_2['embedding'])
            similarity = cosine_similarity(v1, v2)
            chunk_links.append([chunk_1['id'], chunk_2['id'], similarity])
    return chunk_links
def group_by_key(data, key):
    groups = defaultdict(list)
    for d in data:
        groups[d[key]].append(d)
    return groups
def tsne_by_topic(chunks_by_topic):
    chunk_coordinates = {}
    for topic, chunks in chunks_by_topic.items():
        print(topic, len(chunks))
        embeddings = np.array([chunk['embedding'] for chunk in chunks])
        tsne = DataUtils.scatter_plot(embeddings, method="tsne")
        for chunk, XY in zip(chunks, tsne):
            chunk_coordinates[chunk['id']] = XY.tolist()
    return chunk_coordinates

def processData():
    # interview
    interview_dict = defaultdict(dict)
    interviews = []
    data_by_chunk = {}
    for interview_file in glob.glob("data/chunk_summaries_w_ktte/*.json"):
        interview_data = json.load(open(interview_file))
        interview_file = interview_file.replace("\\", "/")
        participant = interview_file.split('/')[-1].replace(".json", "")
        interview_dict[participant] = interview_data
        for chunk in interview_data:
            if chunk['topic'] in ['商業', '汙染', '貿易', '農業']:
                chunk['topic'] = '其他'
            data_by_chunk[chunk['id']] = chunk
    interview_dict = dict(sorted(interview_dict.items(), key=lambda x: int(x[0].replace("N", ""))))
    for participant, interview in interview_dict.items():
        interviews.append(
            {
                "file_name": participant,
                "data": interview
            }
        )

    # for interview_file in glob.glob("../data/result/chunk_summaries/*.json"):
    #     interview_data = json.load(open(interview_file))
    #     file_name = interview_file.split('/')[-1].replace(".json", "")
    #     participant = file_name.split("_")[0]
    #     interviews.append(
    #         {
    #             "file_name": participant,
    #             "data": interview_data
    #         }
    #     )

    # def fcmp(x1, x2):
    #     p1 = int(x1['file_name'].replace("N", "").replace("_background", "").replace("_topics", ""))
    #     p2 = int(x2['file_name'].replace("N", "").replace("_background", "").replace("_topics", ""))
    #     if p1 != p2:
    #         return p1 - p2
    #     else:
    #         if x1['file_name'].find("background") != -1:
    #             return -1
    #         else:
    #             return 0 

    # reports
    reports = []
    report_embeddings = {}
    # for report_file in glob.glob('../data/result/proposal_embeddings/*.json'):
    #     report_data = json.load(open(report_file))
    #     report_file = report_file.replace("\\", "/")
    #     file_name = report_file.split('/')[-1].replace(".json", "")
    #     report_embeddings[file_name] = report_data['embedding']
    #     del report_data['embedding']
    #     reports.append({
    #         "file_name": file_name,
    #         "data": report_data
    #     })

    # chunk_graph
    # chunk_links = json.load(open("../data/result/chunk_similarities.json"))
    chunk_embeddings = json.load(open("data/chunk_embeddings.json"))
    chunk_links = chunk_cosine_similarity(chunk_embeddings)
    chunk_links = normalize_weight(chunk_links)
    chunk_nodes = {}
    for interview in interviews:
        for chunk in interview['data']:
            chunk['keywords'] = chunk['raw_keywords']
            chunk_nodes[chunk['id']] = chunk
    # topic tsnes
    # topic_tsnes = json.load(open('../data/result/chunk_coordinates.json'))
    for chunk in chunk_embeddings:
        chunk['topic'] = data_by_chunk[chunk['id']]['topic']
    chunks_by_topic = group_by_key(chunk_embeddings, 'topic')
    topic_tsnes = tsne_by_topic(chunks_by_topic)
    # keywords 
    # keyword_coordinates = json.load(open('../data/result/keyword_coordinates.json'))
    keywords = json.load(open("data/keywords.json"))
    keyword_embeddings = [keyword['embedding'] for keyword in keywords]
    coordinates = DataUtils.scatter_plot(keyword_embeddings, method="tsne")
    keyword_coordinates = {k['keyword']: c.tolist() for k, c in zip(keywords, coordinates)}
    keyword_statistics = json.load(open('data/keyword_statistics.json'))
    keyword_statistics = {k['keyword']: k for k in keyword_statistics}
    return interviews, reports, report_embeddings, chunk_links, chunk_nodes, topic_tsnes, keyword_coordinates, keyword_statistics

interviews, reports, report_embeddings, chunk_links, chunk_nodes, topic_tsnes, keyword_coordinates, keyword_statistics = processData()
    

@app.route("/test/")
def test():
    return "Hello Lyudao"

@app.route("/data/")
def get_data():
    print("get_data")
    res = {
        'interviews': interviews,
        # 'reports': reports,
        'chunk_links': chunk_links,
        'chunk_nodes': chunk_nodes,
        'topic_tsnes': topic_tsnes,
        'keyword_coordinates': keyword_coordinates,
        'keyword_statistics': keyword_statistics
    }
    return json.dumps(res, default=vars)
# @app.route("/report/relevant_nodes", methods=['POST'])
# def get_relevant_nodes():
#     report = request.json['report']
#     report_embedding = report_embeddings[report]
#     relevant_nodes = document_controller.search_by_embeddings(report_embedding)
#     return json.dumps(relevant_nodes)

# @app.route("/search/", methods=['POST'])
# def search():
#     query = request.json['query']
#     type = request.json['type']
#     doc_id_relevance = document_controller.search(query=query)
#     if type == 'chunk':
#         chunk_id_relevances = [("_".join(doc[0].split("_")[:3]), doc[1]) for doc in doc_id_relevance]
#         existing_chunk_id = []
#         cleaned_chunk_id_relevances = []
#         for chunk_id_relevance in chunk_id_relevances:
#             if chunk_id_relevance[0] not in existing_chunk_id:
#                 existing_chunk_id.append(chunk_id_relevance[0])
#                 cleaned_chunk_id_relevances.append(chunk_id_relevance)
#             else:
#                 continue
#         doc_id_relevance = cleaned_chunk_id_relevances
#     return json.dumps(doc_id_relevance)

