import pandas as pd
import json
from PIL import Image
from PIL.Image import LANCZOS
import re
import math
import logging

logger = logging.getLogger('propinquity')

TILESIZE = 100

def build_web_files(options):
	logger.info("- Building web files for  '%s'" % options['process_id'])

	# create json files with the necessary fields
	process = options['process_id']
	initial_filename = "data/%s/%s.csv" % (process, process)

	na_values = [
		'#N/A', '#N/A N/A', '#NA', '-1.#IND', '-1.#QNAN', '-NaN',
		'-nan', '1.#IND', '1.#QNAN', 'N/A', 'NA', 'NULL', 'NaN', 'nan'
	]
	new_na_values = {'artist' : na_values, 'title' : na_values}
	orig_json = pd.read_csv(initial_filename, encoding='utf-8',
		na_values=new_na_values, keep_default_na=False) \
					.transpose().to_dict().values()
	
	# center embedding coordinates
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
	of = open("data/%s/collection.js" % process, "w")
	of.write("var collection = "+json_string+";\n\n")

	logger.info("drawing out mosaics")

	numWorks = len(output_json)
	mosaics = []
	maxTileDim = 4096/TILESIZE
	maxTiles = maxTileDim*maxTileDim
	num_mosaics = (numWorks / maxTiles)+1

	for mosaic_index in range(num_mosaics):
		# create tiled images for webgl
		startIndex = maxTiles * mosaic_index
		endIndex = min(maxTiles * (mosaic_index+1), numWorks)

		if len(output_json) < (maxTiles * (mosaic_index+1)):
			num_tiles = numWorks % maxTiles
			mosaic_height = (num_tiles / maxTileDim) + 1
			mosaic_width = maxTileDim if num_tiles > maxTileDim else num_tiles
		else:
			num_tiles = maxTiles
			mosaic_height, mosaic_width = maxTileDim, maxTileDim

		mosaic = Image.new("RGB",(mosaic_width*TILESIZE,mosaic_height*TILESIZE))
		for i in range(startIndex, endIndex):
			filename = "data/%s/images/%s.jpg" % (process ,str(output_json[i]['sequence_id']).zfill(4))
			try:
				I = Image.open(filename)
				I = I.resize((TILESIZE,TILESIZE),resample=LANCZOS)
			except:
				logger.warning("image %s could not be loaded" % filename)
				continue

			left = ((i - startIndex) % maxTileDim)*TILESIZE
			top = ((i - startIndex) / maxTileDim)*TILESIZE
			mosaic.paste(I,(left, top, left + TILESIZE, top + TILESIZE))
		mosaic_filename = "data/%s/%s_mosaic_%d.jpg" % (process, process, mosaic_index)
		mosaic.save(mosaic_filename)

		mosaics.append({
			"image" : mosaic_filename.split("/")[-1],
			"mosaicWidth" : mosaic_width,
			"mosaicHeight" : mosaic_height,
			"tileSize" : TILESIZE,
			"tiles" : num_tiles,
			"width" : mosaic_width*TILESIZE,
			"height" : mosaic_height*TILESIZE
		})
	mosaics_json = json.dumps(mosaics, indent=2)
	of.write("var mosaics = "+mosaics_json+";\n")

	# canvas mosaic
	canvas_size = 4096
	canvas_dims = int(math.ceil(math.sqrt(numWorks)))
	canvas_tilesize = canvas_size / canvas_dims
	canvas_mosaic = Image.new("RGB",(canvas_size, canvas_size))
	for i in range(numWorks):
		filename = "data/%s/images/%s.jpg" % (process ,str(output_json[i]['sequence_id']).zfill(4))
		try:
			I = Image.open(filename)
			I = I.resize((canvas_tilesize, canvas_tilesize),resample=LANCZOS)
		except:
			logger.warning("image %s could not be loaded" % filename)
			continue

		left = (i % canvas_dims)*canvas_tilesize
		top = (i / canvas_dims)*canvas_tilesize
		canvas_mosaic.paste(I,(left, top, left + canvas_tilesize, top + canvas_tilesize))
	canvas_mosaic_filename = "data/%s/%s_canvas_mosaic.jpg" % (process, process)
	canvas_mosaic.save(canvas_mosaic_filename)
	canvas_mosaics_json = json.dumps([{
		"image" : canvas_mosaic_filename.split("/")[-1],
		"mosaicWidth" : canvas_dims,
		"mosaicHeight" : canvas_dims,
		"tileSize" : canvas_tilesize,
		"tiles" : numWorks,
		"width" : canvas_size,
		"height" : canvas_size
	}], indent=2)
	of.write("var canvas_mosaics = "+canvas_mosaics_json+";\n")
	
	of.close()
