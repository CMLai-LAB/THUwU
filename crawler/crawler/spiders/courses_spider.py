import scrapy
import datetime

class CoursesSpider(scrapy.Spider):
    name = "courses"

    def start_requests(self):
        semester = self.getSemester()

        # Get all urls
        urls = [
                "https://course.thu.edu.tw/view-dept/" + str(semester['year'])  + "/" + str(semester['semester']) + "/everything",
        ]
        for url in urls:
            yield scrapy.Request(url=url, callback=self.getUrls)

    def getUrls(self, response):
        target_table = response.xpath("/html/body/div/div[2]/div[2]/div[2]/div[2]/table/tbody")
        for url in target_table.xpath(".//tr"):
            url = url.xpath(".//td[1]/a/@href").get()
            yield response.follow(url, callback=self.parse)

    def parse(self, response):
        target_table = response.xpath("/html/body/div[1]/div[2]/div[2]/div[2]/div/table[2]/tbody")

        for course in target_table.xpath(".//tr"):
            id_val = course.xpath(".//td[1]/a/text()").extract_first()
            url_val = course.xpath(".//td[1]/a/@href").extract_first()
            name_val = course.xpath(".//td[2]/a/text()").extract_first()
            credit_val = course.xpath(".//td[3]/text()").extract_first()
            time_val = course.xpath(".//td[4]/text()").extract_first()
            teacher_val = course.xpath(".//td[5]/a/text()").extract_first()
            
            course_obj = {
                "id": id_val.strip() if id_val is not None else "",
                "url": "https://course.thu.edu.tw" + url_val.strip() if url_val is not None else "",
                "name": name_val.strip() if name_val is not None else "",
                "credit": max(credit_val.strip().split('-')) if credit_val is not None else "",
                "time": time_val.strip() if time_val is not None else "",
                "teacher": teacher_val.strip() if teacher_val is not None else "",
            }

            yield course_obj

    def getSemester(self):
        today = datetime.date.today()
        if today.month >= 1 and today.month < 6:
            return {'year': today.year - 1911 - 1, 'semester': 2}
        else:
            return {'year': today.year - 1911, 'semester': 1}
