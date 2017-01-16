# download dimu images
import requests
import shutil
import os
import arrow
from StringIO import StringIO
from PIL import Image
from multiprocessing import Pool
import logging

logger = logging.getLogger('propinquity')

APIKEY = "demo"

def fetch_work_details(options):
	result = options

	if 'artifact.defaultMediaIdentifier' in result:
		image_id = result['artifact.defaultMediaIdentifier']
		object_id = result['identifier.id']
		published_at = result['artifact.publishedDate']
		artist = result['artifact.ingress.producer']
		title = result['artifact.ingress.title']
		year_start = result['artifact.ingress.production.fromYear'] if 'artifact.ingress.production.fromYear' in result else None
		year_end = result['artifact.ingress.production.toYear'] if 'artifact.ingress.production.toYear' in result else None

		work = {
			'sequence_id': None, 
			'identifier': object_id,
			'published_at': published_at, 
			'image_id': image_id, 
			'image_downloaded': 0, 
			'embedded': 0,
			'artist' : artist,
			'title' : title,
			'year_start' : year_start,
			'year_end' : year_end,
			'image_width' : 0,
			'image_height' : 0,
		}
		return work
	else:
		logger.warning("Tried to fetch a work with no 'artifact.defaultMediaIdentifier'.")

	return None

def fetch_image(options):
	result = options

	image_id = result['image_id']
	sequence_id = result['sequence_id']

	img_url = "https://mm.dimu.org/image/%s?dimension=400x400" % image_id
	res = requests.get(img_url)
	if res.status_code == 200:
		try:
			img = Image.open(StringIO(res.content))
			img.load()
			img_width, img_height = img.size
		except:
			logger.warning("the server returned an invalid image from url %s" % img_url)
			return None
		return {'sequence_id' : sequence_id, 'image_data' : res.content, \
			'image_width' : img_width, 'image_height' : img_height}
	else:
		logger.warning("failed downloading images from url %s" % img_url)

	return None


def fetch_new(options):

	logger.info("- Fetching %s" % options['process_id'])

	download_folder = 'data/%s/images/' % options['process_id']
	collection = options['collection']

	artifact_query = ""
	if options['artifact_name'] != None:
		artifact_query = "&fq=artifact.name:%s" % options['artifact_name']

	start_date = "1800-00-00T00:00:00Z"
	if options['start_date'] != None:
		logger.info('- Looking for works since %s' % options['start_date'])
		start_date = arrow.get(options['start_date']) \
			.shift(microseconds=1000).format('YYYY-MM-DDTHH:mm:ss.SSS')+'Z'

	url = "http://api.dimu.org/api/solr/select?q=identifier.owner:%s%s&wt=json&fq=artifact.hasPictures:true&api.key=%s&fq=artifact.publishedDate:[%s TO NOW]&sort=artifact.publishedDate%%20asc" \
		% (options['collection_id'], artifact_query, APIKEY, start_date)

	response = requests.get(url)
	numresults = response.json()['response']['numFound']

	# print "Found %d new works!" % numresults

	if not os.path.exists(download_folder):
		os.makedirs(download_folder)

	# callback from the worker pool
	def completed(results):
		for result in results:
			if not result is None:
				with open(download_folder + str(result['sequence_id']).zfill(4)+".jpg", 'wb') as f:
					f.write(result['image_data'])

				collection.add_image(result['sequence_id'], result['image_width'], result['image_height'])

	# get details of new works
	for r in range(0,numresults,10):
		response = requests.get(url + "&start=" + str(r))
		results = response.json()['response']['docs']

		#insert new results
		for res in results:
			ind = fetch_work_details(res)
			if not ind is None:
				collection.add_work(ind)

		logger.info("- got %d result(s) starting from row %d" % (len(results), r))

	# get a list of all works that we need to download
	results = collection.get_works_to_download()
	logger.info("- downloading %d images" % (len(results)))

	# download works
	pool = Pool(processes=10)
	pool.map_async(fetch_image, results, None, completed)
	pool.close()
	pool.join()

	# print "Done!"
