import os
import json
from PIL import Image

def validate(options):
	process = options['process_id']
	dest_dir = "../dist/data/"+process+"/"
	src_dir = "data/"+process+"/"

	fi = open(src_dir+"collection.js")
	new_content = fi.read().decode('utf-8')
	fi.close()

	new_mosaics_startindex = new_content.find("var mosaics = [")
	new_canvas_mosaics_startindex = new_content.find("var canvas_mosaics = [")
	new_list = json.loads(new_content[17:(new_mosaics_startindex-3)])

	if os.path.exists(dest_dir+"collection.js"):
		fi = open(dest_dir+"collection.js")
		old_content = fi.read().decode('utf-8')
		fi.close()

		old_mosaics_startindex = old_content.find("var mosaics = [")
		old_list = json.loads(old_content[17:(old_mosaics_startindex-3)])

		# check that we have at least as many elements as last time
		assert len(new_list) >= len(old_list), "Number of entries in new collection.js file is shorter than in the old collection.js file"

	# check that all linked files exist and are valid
	mosaics_json = json.loads(new_content[(new_mosaics_startindex+14):(new_canvas_mosaics_startindex-2)])
	for element in mosaics_json:
		img = Image.open(src_dir+element["image"]["jpg"])
		img.load()
		assert img.size[0] == element["pixelWidth"]
		assert img.size[1] == element["pixelWidth"]

	canvas_mosaics_json = json.loads(new_content[(new_canvas_mosaics_startindex+21):(len(new_content)-2)])
	for element in canvas_mosaics_json:
		img = Image.open(src_dir+element["image"]["jpg"])
		img.load()
		assert img.size[0] == element["pixelWidth"]
		assert img.size[1] == element["pixelWidth"]
