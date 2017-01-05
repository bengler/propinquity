import os.path
import datetime
from dateutil import parser
import pandas as pd
import logging

logger = logging.getLogger('propinquity')

class Collection:

	FIELDS = [
		'sequence_id',
		'identifier',
		'published_at',
		'image_id',
		'image_downloaded',
		'embedded'
	]

	def __init__(self, collection_id):

		self.collection_filename = "data/%s/%s.csv" % (collection_id, collection_id)
		self.newWorksFound = 0
		self.modified = False

		if os.path.isfile(self.collection_filename):
			self.works = pd.read_csv(self.collection_filename) \
				.transpose().to_dict().values()
			logger.info("\n\nInstanced %s collection from file" % collection_id)
		else:
			self.works = []
			logger.info("New collection for %s" % collection_id)

	def add_work(self, work):
		identifier = work['identifier']

		if (self.is_retrieved(identifier)):
			return -1

		sequence_id = len(self.works) + 1

		work['sequence_id'] = sequence_id

		self.works.append(work)
		self.newWorksFound += 1
		self.modified = True

		return sequence_id

	def most_recently_published_date(self):
		if len(self.works) == 0:
			return None
		dates = [work['published_at'] for work in self.works]
		return max(dates)

	def is_retrieved(self, identifier):
		# TODO: For > perf than O(n) use a dict
		for work in self.works:
			if work['identifier'] == identifier:
				return True
		return False

	def write(self):
		if self.modified:
			pd.DataFrame(self.works).to_csv(
				self.collection_filename, index=False, columns=self.FIELDS)
			self.modified = False

			logger.info("%d new works written to file" % self.newWorksFound)
			logger.info("Saved modifications to collection")
		else:
			logger.info("No modifications to collection to save")

	def get_works_to_download(self):
		found_works = []
		for work in self.works:
			if work['image_downloaded'] == 0:
				found_works.append(work)

		return found_works

	def add_image(self, sequence_id):
		self.works[int(sequence_id) - 1]['image_downloaded'] = 1
		self.modified = True

		return None

	def get_works_to_embed(self):
		found_works = []
		for work in self.works:
			if work['image_downloaded'] and not work['embedded']:
				found_works.append(work)

		return found_works

	def add_embedding(self, sequence_id):
		self.works[int(sequence_id) - 1]['embedded'] = 1
		self.modified = True
		
		return None
