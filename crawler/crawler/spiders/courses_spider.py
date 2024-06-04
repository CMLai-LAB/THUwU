import json
import scrapy
import datetime


class CoursesSpider(scrapy.Spider):
    name = "courses"

    def start_requests(self):
        semester = self.getSemester()

        # Get all urls
        urls = [
            "https://course.thu.edu.tw/view-dept/" +
            str(semester['year']) + "/" +
            str(semester['semester']) + "/everything",
        ]
        for url in urls:
            yield scrapy.Request(url=url, callback=self.getUrls)

    def getUrls(self, response):
        target_table = response.xpath(
            "/html/body/div/div[2]/div[2]/div[2]/div[2]/table/tbody")
        for url in target_table.xpath(".//tr"):
            department = url.xpath(".//td[1]/a/text()").get()
            url = url.xpath(".//td[1]/a/@href").get()
            yield response.follow(
                url,
                callback=self.parse,
                meta={
                    'department': department.strip() if department is not None else "",
                    'department_id': url.strip().split('/')[-1] if url is not None else "",
                }
            )

    def parse(self, response):
        target_table = response.xpath(
            "/html/body/div[1]/div[2]/div[2]/div[2]/div/table[2]/tbody")

        for course in target_table.xpath(".//tr"):
            id_val = course.xpath(".//td[1]/a/text()").extract_first()
            initial_url = course.xpath(".//td[1]/a/@href").extract_first()
            name_val = course.xpath(".//td[2]/a/text()").extract_first()
            name_type_arr = name_val.strip().split('-') if name_val is not None else None
            credit_val = course.xpath(".//td[3]/text()").extract_first()
            time_val = course.xpath(".//td[4]/text()").extract_first()
            teacher_val = course.xpath(".//td[5]/a/text()").extract_first()
            brief_val = course.xpath(
                "string(.//td[7])").extract_first()

            yield response.follow(
                initial_url,
                callback=self.parseCourse,
                meta={
                    'id': id_val.strip() if id_val is not None else "",
                    'type': name_type_arr[0] if name_type_arr is not None else "",
                    'name': name_type_arr[1] if name_type_arr is not None else "",
                    'credit': max(credit_val.strip().split('-')) if credit_val is not None else "",
                    'time': time_val.strip() if time_val is not None else "",
                    'teacher': teacher_val.strip() if teacher_val is not None else "",
                    'department': response.meta['department'],
                    'department_id': response.meta['department_id'],
                    'brief': brief_val.strip() if brief_val is not None else "",
                }
            )

    def parseCourse(self, response):
        # Get url
        url_val = response.xpath(
            "/html/body/div[1]/div[2]/div[2]/div[5]/div[2]/div[3]/p/a/@href").extract_first()

        # Get description
        desc_val = response.xpath(
            "/html/body/div[1]/div[2]/div[2]/div[4]/div[2]/p[2]/text()").extract_first()

        # Get grading
        grading_table = response.xpath(
            "/html/body/div[1]/div[2]/div[2]/div[2]/div/table/tbody")
        grading_items = []
        flag = False
        for item in grading_table.xpath(".//tr"):
            grading_target = item.xpath(".//td[1]/text()").extract_first()
            grading_ratio = item.xpath(".//td[2]/text()").extract_first()
            grading_desc = item.xpath(".//td[3]/text()").extract_first()
            if flag:
                grading_items.append({
                    "target": grading_target.strip() if grading_target is not None else "",
                    "ratio": grading_ratio.strip() if grading_ratio is not None else "",
                    "description": grading_desc.strip() if grading_desc is not None else "",
                })
            flag = True

        # Create course object
        yield {
            'id': response.meta['id'],
            'type': response.meta['type'],
            'name': response.meta['name'],
            'credit': response.meta['credit'],
            'time': response.meta['time'],
            'teacher': response.meta['teacher'],
            'department': response.meta['department'],
            'department_id': response.meta['department_id'],
            'url': url_val.strip() if url_val is not None else "",
            'brief': response.meta['brief'],
            'description': desc_val.strip() if desc_val is not None else "無資料",
            'grading': grading_items,
        }

    def getSemester(self):
        with open("../semesterConfig.json", "r") as f:
            data = json.load(f)
            return {'year': data["YEAR"], 'semester': data["SEMESTER"]}
        return {}
