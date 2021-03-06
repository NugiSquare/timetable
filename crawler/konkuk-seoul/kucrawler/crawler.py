"""
Copyright (C) 2015 Sanghyuck Lee <shlee322@elab.kr>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
"""
import logging
import sys
import json
import os
from os import path
from urllib import parse

import requests
from bs4 import BeautifulSoup

from .lecture_time import get_lecture_timetable
from .jsonp import jsonp

TERM_CODE = {
    '1': 'B01011',  # 1학기
    '2': 'B01014',  # 여름학기
    '3': 'B01012',  # 2학기
    '4': 'B01015'  # 겨울학기
}

year = sys.argv[1]
term = TERM_CODE.get(sys.argv[2])
data_dir = sys.argv[3]

department_file = path.join(data_dir, 'department.json')
lecture_dir = path.join(data_dir, 'lecture')
lecture_department_index_dir = path.join(data_dir, 'lecture_department_index')

departments = []
lectures = {}


class Lecture:
    def __init__(self, data):
        self.id = data[2].text
        self.type = None
        self.grade = int(data[0].text) if data[0].text else None
        self.subject_code = None
        self.subject_name = None
        self.credit = 0
        self.timetable = []
        self.tags = []
        self.professors = []
        self.links = []
        self.departments = []

        self.load_data()

        if data[9].text != '':
            self.tags.append(data[9].text)
        if data[12].text != '':
            self.tags.append('PASS')
        if data[13].text != '':
            self.tags.append(data[13].text)

    def load_data(self):
        query = parse.urlencode({
            'callback': 'timetable',
            'ltYy': year,
            'ltShtm': term,
            'sbjtId': self.id,
        })

        res = requests.get(
            'http://kupis.konkuk.ac.kr/sugang/acd/cour/time/MobileTimeTableInfoList.jsp?%s' % query,
            headers={
                'User-Agent': 'Timetable; (+https://github.com/shlee322/timetable; Contact;)'
            })

        more_data = jsonp(res.text)
        self.subject_code = more_data[0].get('haksuId')
        self.subject_name = more_data[0].get('subject')
        self.type = more_data[0].get('pobtDivNm')
        self.credit = int(more_data[0].get('pnt'))
        self.timetable, self.tags = get_lecture_timetable(more_data[0].get('time'))
        self.professors = more_data[0].get('prof').split(',')

        self.links.append({
            'name': '강의계획서',
            'url': 'http://kupis.konkuk.ac.kr/sugang/acd/cour/plan/CourLecturePlanInq.jsp?ltYy=%s&ltShtm=%s&sbjtId=%s' % (year, term, self.id)
        })
        self.links.append({
            'name': '교과해설',
            'url': 'http://kupis.konkuk.ac.kr/sugang/acd/cour/plan/CourLectureDetailInq.jsp?openYy=%s&haksuId=%s' % (year, self.subject_code)
        })
        self.links.append({
            'name': '인원검색',
            'url': 'http://kupis.konkuk.ac.kr/sugang/acd/cour/aply/CourInwonInqTime.jsp?ltYy=%s&ltShtm=%s&sbjtId=%s' % (year, term, self.id)
        })

    def add_department(self, department):
        self.departments.append(department)

    def to_json(self):
        return json.dumps({
            'id': self.id,
            'type': self.type,
            'grade': self.grade,
            'subject_code': self.subject_code,
            'subject_name': self.subject_name,
            'credit': self.credit,
            'timetable': self.timetable,
            'tags': self.tags,
            'professors': self.professors,
            'links': self.links,
            'departments': self.departments
        })


def init_dir():
    print("Konkuk Univ - Seoul Campus : init_dir")
    if not path.exists(lecture_dir):
        os.makedirs(lecture_dir)

    if not path.exists(lecture_department_index_dir):
        os.makedirs(lecture_department_index_dir)


def load_departments():
    print("Konkuk Univ - Seoul Campus : load_departments")
    res = requests.get(
        'http://kupis.konkuk.ac.kr/sugang/acd/cour/time/SeoulTimetableInfo.jsp',
        headers={
            'User-Agent': 'Timetable; (+https://github.com/shlee322/timetable; Contact;)'
        })

    soup = BeautifulSoup(res.text, "html.parser")
    sust_list = soup.find('select', {'name': 'openSust'})

    for sust in sust_list.find_all('option'):
        if not sust['value']:
            continue
        departments.append({
            'id': sust['value'],
            'name': sust.text.strip()
        })

    open(department_file, 'w').write(json.dumps(departments))


def load_lectures():
    for department in departments:
        print("Konkuk Univ - Seoul Campus : load_lectures(department=%s)" % department)
        res = requests.post(
            'http://kupis.konkuk.ac.kr/sugang/acd/cour/time/SeoulTimetableInfo.jsp',
            data={
                'ltYy': year,
                'ltShtm': term,
                'openSust': department['id'],
                'pobtDiv': 'ALL'
            },
            headers={
                'User-Agent': 'Timetable; (+https://github.com/shlee322/timetable; Contact;)'
            })

        soup = BeautifulSoup(res.text, "html.parser")

        lecture_table = soup.find('table', {
            'class': 'table_bg',
            'cellpadding': '0',
            'cellspacing': '1',
            'border': '0',
            'width': '100%'
        })

        lecture_department_index = []
        for lecture in lecture_table.find_all('tr')[1:]:
            td_list = lecture.find_all('td')
            if len(td_list) == 1:
                continue

            if td_list[2].text not in lectures:
                lectures[td_list[2].text] = Lecture(td_list)

            lectures[td_list[2].text].add_department(department['id'])

            lecture_department_index.append(td_list[2].text)

        open(path.join(lecture_department_index_dir, '%s.json' % department['id']), 'w').write(
            json.dumps(lecture_department_index))


def save_lecture():
    print("Konkuk Univ - Seoul Campus : save_lecture")
    for lecture in lectures.values():
        open(path.join(lecture_dir, '%s.json' % lecture.id), 'w').write(lecture.to_json())
