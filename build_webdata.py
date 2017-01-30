import pandas as pd
import json
from PIL import Image
from PIL.Image import LANCZOS
import re
import math
import logging

logger = logging.getLogger('propinquity')

def build_web_files(options):
	logger.info("- Building web files for  '%s'" % options['process_id'])

	# create json files with the necessary fields
	process = options['process_id']
	initial_filename = "data/%s/%s.csv" % (process, process)
	orig_json = pd.read_csv(initial_filename, encoding='utf-8') \
					.transpose().to_dict().values()

	# load embedding coordinates
	num_embeddings = 0
	x_mean = 0.0
	y_mean = 0.0
	for work in orig_json:
		if work['embedded'] == 1:
			num_embeddings += 1
			x_mean += work['embedding_x']
			y_mean += work['embedding_y']
	x_mean /= num_embeddings
	y_mean /= num_embeddings
	for work in orig_json:
		work['embedding_x'] -= x_mean
		work['embedding_y'] -= y_mean

	output_json = []

	for work in orig_json:
		if work['image_downloaded'] == 1 and work['embedded'] == 1:
			# fix yearstring
			if work['year_start'] == work['year_end']:
				work['yearstring'] = str(int(work['year_start']))
			else:
				year_start = str(int(work['year_start'])) if not math.isnan(work['year_start']) else ''
				year_end = str(int(work['year_end'])) if not math.isnan(work['year_end']) else ''
				work['yearstring'] = year_start+"-"+year_end
				if len(work['yearstring']) == 1:
					work['yearstring'] = ''
			
			# remove all text "[]" from title
			work['title'] = re.sub('\[.*?\]','', work['title']).strip()

			# change name order
			names = work['artist'].split(",")
			if len(names) > 1:
				work['artist'] = names[1].strip()+" "+names[0].strip()

			del work['embedded']
			del work['image_downloaded']
			del work['year_start']
			del work['year_end']
			output_json.append(work)

	json_string = json.dumps(output_json, indent=2)
	of = open("data/%s/%s.js" % (process, process),"w")
	of.write("var collection = "+json_string)
	of.close()

	# create tiled image for webgl (test with 100 by 100 images)
	print "drawing out"
	S = 4000 # size of canvas
	tiles = Image.new("RGB",(S,S))
	s = 100 # size of every tile
	added_images = 0
	for i,work in enumerate(output_json):
		if added_images == 1600:
			break
		filename = "data/%s/images/%s.jpg" % (process ,str(work['sequence_id']).zfill(4))
		try:
			I = Image.open(filename)
			I = I.resize((100,100),resample=LANCZOS)
		except:
			print "image %s could not be loaded" % filename
			continue

		left = (i % 40)*100
		upper = (i / 40)*100
		right = left + 100
		lower = upper + 100
		tiles.paste(I,(left, upper, right, lower))
		added_images += 1
	tiles.save("data/%s/tiled_map_40x40_100.jpg" % process)

if __name__ == "__main__":
	build_web_files({'process_id' : 'painting'})