import fetcher
import embedder
from collection import Collection

collectionOpts = [
  {
    'collection_id': 'NMK-B',
    'artifact_name': 'Fotografi',
    'process_id': 'photography'
  },
  {
    'collection_id': 'NMK-B',
    'artifact_name': 'Maleri',
    'process_id': 'painting'
  },
  {
    'collection_id': 'NMK-B',
    'artifact_name': 'Grafikk',
    'process_id': 'printmaking'
  },
  {
    'collection_id': 'NMK-B',
    'artifact_name': 'Tegning',
    'process_id': 'drawings'
  },
  {
    'collection_id': 'NMK-D',
    'artifact_name': None,
    'process_id': 'design'
  }
]

for options in collectionOpts:

  collection = Collection(options['process_id'])

  options['start_date'] = collection.most_recently_published_date()
  options['collection'] = collection

  fetcher.fetch_new(options)
  collection.write()
  embedder.embed_new(options)
  collection.write()

