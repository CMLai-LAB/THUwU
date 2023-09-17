# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
from itemadapter import ItemAdapter
import json
import datetime


class CrawlerPipeline:
    def open_spider(self, spider):
        self.data_obj = {}

    def close_spider(self, spider):
        semester = self.getSemester()
        filename = '../course-data/' + str(semester['year'])+str(semester['semester']) + '-data.json'
        with open(filename, 'w') as outfile:
            json.dump(self.data_obj, outfile, ensure_ascii=False, indent=None, separators=(',', ':'))

    def process_item(self, item, spider):
        self.data_obj[item["id"]] = item
        return item

    def getSemester(self):
        today = datetime.date.today()
        if today.month >= 1 and today.month < 6:
            return {'year': today.year - 1911 - 1, 'semester': 2}
        else:
            return {'year': today.year - 1911, 'semester': 1}
