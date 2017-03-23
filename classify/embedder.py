import requests
import sys
import os
import numpy as np
import csv
import shutil
from StringIO import StringIO
import logging
from requests.exceptions import RequestException

logger = logging.getLogger('propinquity')

# suppress info from Keras/TensorFlow to console
stderr = sys.stderr
sys.stderr = StringIO()
import tensorflow as tf
from keras import backend as K
sys.stderr = stderr

sess = tf.Session()
K.set_session(sess)
from keras.models import load_model
from ptsne import KLdivergence

# suppress info from Caffe to console
os.environ['GLOG_minloglevel'] = '2'
import caffe

class Embedding_model:

	MODEL_MAP = {
		'photography' : {
			'caffe_model_definition' : {
				'filename': 'keywords_deploy.prototxt',
				'source': 'https://www.dropbox.com/s/s8n974rhqhhxnll/deploy.prototxt?dl=1'
			},
			'caffe_model_weights' : {
				'filename': 'keywords_model.caffemodel',
				'source': 'https://www.dropbox.com/s/s55vcd3ejtt597u/finetuned_bengler_googlenet_lr0.0001to0.00001_iter_40000.caffemodel?dl=1'
			},
			'tsne' : {
				'filename': 'photo_ptsne.h5',
				'source': 'https://www.dropbox.com/s/e5dw0j5k647ln7j/DM_keyword_model_9.h5?dl=1'
			}
		},
		'painting_subject' : {
			'caffe_model_definition' : {
				'filename': 'keywords_deploy.prototxt',
				'source': 'https://www.dropbox.com/s/s8n974rhqhhxnll/deploy.prototxt?dl=1'
			},
			'caffe_model_weights' : {
				'filename': 'keywords_model.caffemodel',
				'source': 'https://www.dropbox.com/s/s55vcd3ejtt597u/finetuned_bengler_googlenet_lr0.0001to0.00001_iter_40000.caffemodel?dl=1'
			},
			'tsne' : {
				'filename': 'painting_ptsne.h5',
				'source': 'https://www.dropbox.com/s/e5dw0j5k647ln7j/DM_keyword_model_9.h5?dl=1'
			}
		},
		'painting_style' : {
			'caffe_model_definition' : {
				'filename': 'style_deploy.prototxt',
				'source': 'https://www.dropbox.com/s/8thywuijcd5npst/deploy.prototxt?dl=1'
			},
			'caffe_model_weights' : {
				'filename': 'style_model.caffemodel',
				'source': 'https://www.dropbox.com/s/i0xj35eokn7n2rs/finetuned_bengler_googlenet_2_iter_302457.caffemodel?dl=1'
			},
			'tsne' : {
				'filename': 'painting_style_ptsne.h5',
				'source': 'https://www.dropbox.com/s/q3rma3zjaue4v7k/DM_style_model_3.h5?dl=1',
				'transpose' : True
			}
		},
		'printmaking' : {
			'caffe_model_definition' : {
				'filename': 'keywords_deploy.prototxt',
				'source': 'https://www.dropbox.com/s/s8n974rhqhhxnll/deploy.prototxt?dl=1'
			},
			'caffe_model_weights' : {
				'filename': 'keywords_model.caffemodel',
				'source': 'https://www.dropbox.com/s/s55vcd3ejtt597u/finetuned_bengler_googlenet_lr0.0001to0.00001_iter_40000.caffemodel?dl=1'
			},
			'tsne' : {
				'filename': 'prints_ptsne.h5',
				'source': 'https://www.dropbox.com/s/5jbha4evz5svr8x/DM_printmaking_model_3.h5?dl=1'
			}
		},
		'drawings' : {
			'caffe_model_definition' : {
				'filename': 'keywords_deploy.prototxt',
				'source': 'https://www.dropbox.com/s/s8n974rhqhhxnll/deploy.prototxt?dl=1'
			},
			'caffe_model_weights' : {
				'filename': 'keywords_model.caffemodel',
				'source': 'https://www.dropbox.com/s/s55vcd3ejtt597u/finetuned_bengler_googlenet_lr0.0001to0.00001_iter_40000.caffemodel?dl=1'
			},
			'tsne' : {
				'filename': 'drawings_ptsne.h5',
				'source': 'https://www.dropbox.com/s/6w75l3o51r7hwsp/DM_drawings_model_1.h5?dl=1'
			}
		},
		'design' : {
			'caffe_model_definition' : {
				'filename': 'deploy.prototxt',
				'source': 'https://raw.githubusercontent.com/BVLC/caffe/master/models/bvlc_googlenet/deploy.prototxt'
			},
			'caffe_model_weights' : {
				'filename': 'bvlc_googlenet.caffemodel',
				'source': 'http://dl.caffe.berkeleyvision.org/bvlc_googlenet.caffemodel'
			},
			'tsne' : {
				'filename': 'design_ptsne.h5',
				'source': 'https://www.dropbox.com/s/a18ov3hh4d2bzvs/DM_design_model_2.h5?dl=1'
			}
		},
	}

	MEAN_IMAGE = np.array([104.,117.,123.])

	def __init__(self, process_id):
		models = self.MODEL_MAP[process_id]
		self.loaded_models = False
		
		modelfolder = os.path.join("data/", process_id, "models")
		if not os.path.exists(modelfolder):
			os.makedirs(modelfolder)

		# download models if needed
		for model in models.values():
			filename = os.path.join(modelfolder, model['filename'])
			if not os.path.exists(filename):
				logger.info("could not find model file '%s', downloading..." % filename)
				try:
					response = requests.get(model['source'], stream=True)
					with open(filename, 'wb') as out_file:
						for chunk in response.iter_content(chunk_size=128):
							out_file.write(chunk)
				except RequestException:
					logger.error("could not download model file '%s', aborting embedding..." % filename)
					return None

		caffe_model_definition = os.path.join(modelfolder, models['caffe_model_definition']['filename'])
		caffe_model_weights = os.path.join(modelfolder, models['caffe_model_weights']['filename'])
		keras_ptsne_model = os.path.join(modelfolder, models['tsne']['filename'])

		# initialize models 
		self.net = caffe.Classifier(caffe_model_definition, caffe_model_weights, mean=self.MEAN_IMAGE, channel_swap=(2,1,0),raw_scale=255,image_dims=(224,224))
		self.net.blobs['data'].reshape(1,3,224,224)

		# initialize t-sne
		self.tsne = load_model(keras_ptsne_model, custom_objects={'KLdivergence' : KLdivergence})
		self.transpose_tsne = True if 'transpose' in models['tsne'] else False

		self.loaded_models = True

	def net_weights(self, image):
		input_image = caffe.io.load_image(image)
		prediction = self.net.predict([input_image], oversample=False)
		features = self.net.blobs['pool5/7x7_s1'].data[:,:,0,0]

		return features

	def tsne_embed(self, features):
		pred = self.tsne.predict(features)
		if self.transpose_tsne:
			pred = pred[:,[1,0]]

		return pred

	def embed(self, image_file):
		# transform with caffe
		features = self.net_weights(image_file)
		
		# transform those features with t-sne
		embedding = self.tsne_embed(features)

		embedding = list(embedding[0,:])
		return embedding

def embed_new(options):
	logger.info("- Embedding %s" % options['process_id'])
	
	# get net models and tsne
	embedder = Embedding_model(options['process_id'])
	if not embedder.loaded_models:
		return None

	images_root = 'data/%s/images/' % options['process_id']

	collection = options['collection']
	works_to_embed = collection.get_works_to_embed()
	logger.info("- embedding %d images" % (len(works_to_embed)))
	for work in works_to_embed:
		sequence_id = work['sequence_id']

		work_image = images_root + str(sequence_id).zfill(4) + ".jpg"
		embedding = embedder.embed(work_image)
		collection.add_embedding(sequence_id, embedding)
