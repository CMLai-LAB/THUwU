# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html


# useful for handling different item types with a single interface
from itemadapter import ItemAdapter
import json


class CrawlerPipeline:
    def open_spider(self, spider):
        self.data_obj = {}

    def close_spider(self, spider):
        semester = self.getSemester()

        # Save the department data
        department = {}
        for course_id in self.data_obj:
            department_id = self.data_obj[course_id]['department_id']
            department_name = self.data_obj[course_id]['department']
            college_name = self.data_obj[course_id]['college']
            department[department_id] = {
                'name': department_name, 'college': college_name}
        department_file = '../course-data/' + \
            str(semester['year']) + \
            str(semester['semester']) + '-dep-data.json'
        with open(department_file, 'w') as outfile:
            json.dump(department, outfile, ensure_ascii=False,
                      indent=None, separators=(',', ':'))

        # Save the course data
        course_file = '../course-data/' + \
            str(semester['year'])+str(semester['semester']) + '-data.json'
        processed_course = {}
        for course_id in self.data_obj:
            self.data_obj[course_id].pop('department')
            self.data_obj[course_id].pop('college')
            processed_course[course_id] = self.data_obj[course_id]
        with open(course_file, 'w') as outfile:
            json.dump(self.data_obj, outfile, ensure_ascii=False,
                      indent=None, separators=(',', ':'))

    def process_item(self, item, spider):
        self.data_obj[item["id"]] = item
        return item

    def getSemester(self):
        with open('../semesterConfig.json', 'r') as f:
            data = json.load(f)
            return {'year': data['YEAR'], 'semester': data['SEMESTER']}

        return {}
