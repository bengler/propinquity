import pandas as pd
import json
from PIL import Image
from PIL.Image import LANCZOS
import re
import math
import logging
import subprocess
from subprocess import CalledProcessError
import os

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

		if endIndex == numWorks:
			# find suitable Power-of-Two dimensions
			num_tiles = endIndex-startIndex
			mosaic_width = int(math.ceil(math.sqrt(num_tiles)))
			PoT_dim = int(math.pow(2, math.ceil(math.log(mosaic_width*TILESIZE,2))))
		else:
			num_tiles = maxTiles
			mosaic_width = maxTileDim
			PoT_dim = 4096

		mosaic_images = {}

		mosaic = Image.new("RGB",(PoT_dim,PoT_dim))
		for i in range(startIndex, endIndex):
			filename = "data/%s/images/%s.jpg" % (process ,str(output_json[i]['sequence_id']).zfill(4))
			try:
				I = Image.open(filename)
				I = I.resize((TILESIZE,TILESIZE),resample=LANCZOS)
			except:
				logger.warning("image %s could not be loaded" % filename)
				continue

			left = ((i - startIndex) % mosaic_width)*TILESIZE
			top = ((i - startIndex) / mosaic_width)*TILESIZE
			mosaic.paste(I,(left, top, left + TILESIZE, top + TILESIZE))

		mosaic_filename = "data/%s/%s_mosaic_%d.jpg" % (process, process, mosaic_index)
		mosaic.save(mosaic_filename, format="jpeg", optimize=True)
		mosaic_images['jpg'] = "%s_mosaic_%d.jpg" % (process, mosaic_index)

		mosaic_lg_filename = "data/%s/%s_mosaic_%d.png" % (process, process, mosaic_index)
		mosaic.save(mosaic_lg_filename, format="png")
		mosaic_lg_abspath = os.path.abspath(mosaic_lg_filename)

		# create s3tc version
		logger.info("Creating s3tc compressed texture ... ")
		try:
			subprocess.check_call(
				"nvcompress -bc1 -nomips "+mosaic_lg_abspath+" "+mosaic_lg_abspath[0:-4]+".dds",
				shell=True)
		except CalledProcessError as err:
			logger.warning("Failed to create s3tc compressed texture for mosaic %d, process '%s', output was : %s" % (mosaic_index, process, err.output))
		else:
			mosaic_images['s3tc'] = "%s_mosaic_%d.dds" % (process, mosaic_index)

		# create pvrtc version
		logger.info("Creating pvrtc compressed texture ... ")
		try:
			subprocess.check_call(
				"./PVRTexToolCLI -i "+mosaic_lg_abspath+" -f PVRTC1_4_RGB -q pvrtcbest -o "+mosaic_lg_abspath[0:-4]+".pvr",
				shell=True)
		except CalledProcessError as err:
			logger.warning("Failed to create pvrtc compressed texture for mosaic %d, process '%s', output was : %s" % (mosaic_index, process, err.output))
		else:
			mosaic_images['pvrtc'] = "%s_mosaic_%d.pvr" % (process, mosaic_index)

		os.remove(mosaic_lg_filename)

		mosaics.append({
			"image" : mosaic_images,
			"mosaicWidth" : mosaic_width,
			"tileSize" : TILESIZE,
			"tiles" : num_tiles,
			"pixelWidth" : PoT_dim
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
		"tileSize" : canvas_tilesize,
		"tiles" : numWorks,
		"pixelWidth" : canvas_size
	}], indent=2)
	of.write("var canvas_mosaics = "+canvas_mosaics_json+";\n")
	
	of.close()
