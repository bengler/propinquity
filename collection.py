import os.path
import datetime
import csv
from dateutil import parser

FIELDS = {
	'sequence_id': 0,
	'identifier': 1,
	'published_at': 2,
	'image_id': 3,
	'image_downloaded' : 4,
	'embedded': 5
}

class Collection:

	def __init__(self, collection_id):

		self.collection_filename = "data/%s/%s.csv" % (collection_id, collection_id)
		self.newWorksFound = 0

		if os.path.isfile(self.collection_filename):
			with open(self.collection_filename) as csvfile:
				# Read rows and chop header
				self.works = [data for data in csv.reader(csvfile)][1:]
				print "\n\nInstanced %s collection from file" % collection_id
		else:
				self.works = []
				print "New collection for %s" % collection_id

	def add_work(self, work):
		identifier = work[FIELDS['identifier']]

		if (self.is_retrieved(identifier)):
			return -1

		sequence_id = len(self.works) + 1

		work[FIELDS['sequence_id']] = sequence_id

		self.works.append(work)
		self.newWorksFound += 1

		return sequence_id

	def most_recently_published_date(self):
		if len(self.works) == 0:
			return None
		dates = [work[FIELDS['published_at']] for work in self.works]
		return max(dates)

	def is_retrieved(self, identifier):
		# TODO: For > perf than O(n) use a dict
		for work in self.works:
			if work[1] == identifier:
				return True
		return False

	def write(self):

		if self.newWorksFound > 0:
			print "%d works written to file" % self.newWorksFound

			with open(self.collection_filename, 'wb') as csvfile:
				csv_writer = csv.writer(csvfile)
				csv_writer.writerow(FIELDS.keys())
				for w in self.works:
					csv_writer.writerow(w)
		else:
			print "No new works found"

	def get_works_to_download(self):
		found_works = []
		for work in self.works:
			if work[FIELDS['image_downloaded']] == 0:
				found_works.append(work)

		return found_works

	def add_image(self, sequence_id):
		self.works[sequence_id][FIELDS['image_downloaded']] = 1

		return None

	def get_works_to_embed(self):
		found_works = []
		for work in self.works:
			if work[FIELDS['embedded']] == 0:
				found_works.append(work)

		return found_works

	def add_embedding(self, sequence_id):
		self.works[sequence_id][FIELDS['embedded']] = 1
		
		return None
