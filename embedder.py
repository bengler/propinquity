import requests
import sys
import os
import numpy as np
import collection
import csv
from keras.models import load_model
from ptsne import KLdivergence

# don't output info from Caffe to console
os.environ['GLOG_minloglevel'] = '2'
sys.path.insert(0, '/home/audun/caffe3b/python')
import caffe

class Embedding_model:

	MODEL_MAP = {
		'photography' : {
			'caffe_model_definition' : {
				'filename': 'models/deploy.prototxt',
				'source': 's3://some.url'
			},
			'caffe_model_weights' : {
				'filename': 'models/some_model.caffemodel',
				'source': 's3://some.url'
			},
			'tsne' : {
				'filename': 'models/tsne.h5',
				'source': 's3://some.url'
			}
		},
		'painting' : {
			'caffe_model_definition' : {
				'filename': 'models/deploy.prototxt',
				'source': 's3://some.url'
			},
			'caffe_model_weights' : {
				'filename': 'models/finetuned_bengler_googlenet_2_iter_302457.caffemodel',
				'source': 's3://some.url'
			},
			'tsne' : {
				'filename': 'models/style_model.h5',
				'source': 's3://some.url'
			}
		},
		'printmaking' : {
			'caffe_model_definition' : {
				'filename': 'models/deploy.prototxt',
				'source': 's3://some.url'
			},
			'caffe_model_weights' : {
				'filename': 'models/some_model.caffemodel',
				'source': 's3://some.url'
			},
			'tsne' : {
				'filename': 'models/tsne.h5',
				'source': 's3://some.url'
			}
		},
		'drawings' : {
			'caffe_model_definition' : {
				'filename': 'models/deploy.prototxt',
				'source': 's3://some.url'
			},
			'caffe_model_weights' : {
				'filename': 'models/some_model.caffemodel',
				'source': 's3://some.url'
			},
			'tsne' : {
				'filename': 'models/tsne.h5',
				'source': 's3://some.url'
			}
		},
		'design' : {
			'caffe_model_definition' : {
				'filename': 'models/deploy.prototxt',
				'source': 's3://some.url'
			},
			'caffe_model_weights' : {
				'filename': 'models/some_model.caffemodel',
				'source': 's3://some.url'
			},
			'tsne' : {
				'filename': 'models/tsne.h5',
				'source': 's3://some.url'
			}
		},
	}

	MEAN_IMAGE = np.array([104.,117.,123.])

	def __init__(self, process_id):
		models = self.MODEL_MAP[process_id]
		
		# download models if needed
		for model in models.values():
			filename = os.path.join("data/", process_id, model['filename'])
			if not os.path.exists(filename):
				print "could not find model file '%s', downloading..." % filename
				r = requests.get(model['source'], stream=True)
				with open(filename, 'wb') as out_file:
					shutil.copyfileobj(response.raw, out_file)

		caffe_model_definition = os.path.join("data/", process_id, models['caffe_model_definition']['filename'])
		caffe_model_weights = os.path.join("data/", process_id, models['caffe_model_weights']['filename'])
		keras_ptsne_model = os.path.join("data/", process_id, models['tsne']['filename'])

		# initialize models 
		self.net = caffe.Classifier(caffe_model_definition, caffe_model_weights, mean=self.MEAN_IMAGE, channel_swap=(2,1,0),raw_scale=255,image_dims=(224,224))
		self.net.blobs['data'].reshape(1,3,224,224)

		# initialize t-sne
		self.tsne = load_model(keras_ptsne_model, custom_objects={'KLdivergence' : KLdivergence})

	def net_weights(self, image):
		input_image = caffe.io.load_image(image)
		prediction = self.net.predict([input_image], oversample=False)
		features = self.net.blobs['pool5/7x7_s1'].data[:,:,0,0]

		return features

	def tsne_embed(self, features):
		pred = self.tsne.predict(features)

		return pred

	def embed(self, image_file):
		# transform with caffe
		features = self.net_weights(image_file)
		
		# transform those features with t-sne
		embedding = self.tsne_embed(features)

		embedding = list(embedding[0,:])
		return embedding

def embed_new(options):
	print "- Embedding %s" % options['process_id']

	# get net models and tsne
	embedder = Embedding_model(options['process_id'])

	images_root = 'data/%s/images/' % options['process_id']

	csv_file = open(os.path.join('data/', options['process_id'], 'embeddings.csv'),'a')
	csv_writer = csv.writer(csv_file)

	for work in options['collection'].works:
		if work[collection.FIELDS['published_at']] > options['start_date']:
			work_image = images_root + str(work[collection.FIELDS['sequence_id']]).zfill(4) + ".jpg"
			embedding = embedder.embed(work_image)
			csv_writer.writerow([work_image] + embedding)

