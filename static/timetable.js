/*
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
*/
var Campus = (function () {
    function Campus(campus_info) {
        this.id = campus_info.id;
        this.univ_name = campus_info.univ_name;
        this.campus_name = campus_info.campus_name;
    }
    Campus.prototype.getId = function () {
        return this.id;
    };
    Campus.prototype.getUnivName = function () {
        return this.univ_name;
    };
    Campus.prototype.getCampusName = function () {
        return this.campus_name;
    };
    return Campus;
})();
var Department = (function () {
    function Department(department_info) {
        this.id = department_info.id;
        this.name = department_info.name;
    }
    Department.prototype.getId = function () {
        return this.id;
    };
    Department.prototype.getName = function () {
        return this.name;
    };
    return Department;
})();
var LectureTime = (function () {
    function LectureTime(time_info) {
        this.place = time_info.place;
        this.time = time_info.time;
    }
    LectureTime.prototype.getWeekdayCode = function () {
        return Math.floor(this.time.start / (60 * 60 * 24));
    };
    LectureTime.prototype.getWeekdayString = function () {
        var code = this.getWeekdayCode();
        if (code == 0)
            return '월';
        if (code == 1)
            return '화';
        if (code == 2)
            return '수';
        if (code == 3)
            return '목';
        if (code == 4)
            return '금';
        if (code == 5)
            return '토';
        if (code == 6)
            return '일';
        return 'err';
    };
    LectureTime.getDayTime = function (time) {
        var weekday = Math.floor(time / (60 * 60 * 24));
        return time - weekday * 60 * 60 * 24;
    };
    LectureTime.getTimeString = function (time) {
        var weekday = Math.floor(time / (60 * 60 * 24));
        time = time - weekday * 60 * 60 * 24;
        var hour = Math.floor(time / (60 * 60));
        time -= hour * 60 * 60;
        var min = Math.floor(time / 60);
        return String("0" + hour).slice(-2) + ':' + String("0" + min).slice(-2);
    };
    LectureTime.prototype.getStartTimeString = function () {
        return LectureTime.getTimeString(this.time.start);
    };
    LectureTime.prototype.getEndTimeString = function () {
        return LectureTime.getTimeString(this.time.end);
    };
    LectureTime.prototype.getDayStartTime = function () {
        return LectureTime.getDayTime(this.time.start);
    };
    LectureTime.prototype.getDayEndTime = function () {
        return LectureTime.getDayTime(this.time.end);
    };
    return LectureTime;
})();
var Lecture = (function () {
    function Lecture(campus_id, year, term, lecture_id) {
        this._loading = false;
        this.campus_id = campus_id;
        this.year = year;
        this.term = term;
        this.id = lecture_id;
        this.credit = 0;
        this.departments = [];
        this.grade = 0;
        this.links = [];
        this.professors = [];
        this.subject_code = "";
        this.subject_name = "";
        this.tags = [];
        this.timetable = [];
        this.type = "";
    }
    Lecture.prototype.getId = function () {
        return this.id;
    };
    Lecture.prototype.getSubjectCode = function () {
        return this.subject_code;
    };
    Lecture.prototype.getSubjectName = function () {
        return this.subject_name;
    };
    Lecture.prototype.isLoad = function () {
        return this._loading;
    };
    Lecture.prototype.getCredit = function () {
        return this.credit;
    };
    Lecture.prototype.overlapTime = function (target) {
        for (var this_i = 0; this_i < this.timetable.length; this_i++) {
            for (var target_i = 0; target_i < target.timetable.length; target_i++) {
                var this_time = this.timetable[this_i];
                var target_time = target.timetable[target_i];
                if (this_time.time.start < target_time.time.end && target_time.time.start < this_time.time.end) {
                    return true;
                }
            }
        }
        return false;
    };
    Lecture.prototype.update = function () {
        var lecture = this;
        $.get('data/' + this.campus_id + '/' + this.year + '/' + this.term + '/lecture/' + this.id + '.json', function (data) {
            lecture._loading = true;
            lecture.credit = data.credit;
            lecture.departments = data.departments;
            lecture.grade = data.grade;
            lecture.links = data.links;
            lecture.professors = data.professors;
            lecture.subject_code = data.subject_code;
            lecture.subject_name = data.subject_name;
            lecture.tags = data.tags;
            lecture.timetable = [];
            for (var i = 0; i < data.timetable.length; i++)
                lecture.timetable.push(new LectureTime(data.timetable[i]));
            lecture.type = data.type;
            lecture.showResultList(false);
            Timetable.getInstance().updateShowLectures();
        });
    };
    Lecture.prototype.showResultList = function (create) {
        var viewer = document.getElementById('search_results');
        var lectureHTML = null;
        if (create) {
            lectureHTML = document.createElement('button');
        }
        else {
            lectureHTML = document.getElementById('search_results_lecture_' + this.id);
        }
        if (!lectureHTML)
            return;
        lectureHTML.setAttribute('id', 'search_results_lecture_' + this.id);
        lectureHTML.setAttribute('class', 'list-group-item');
        lectureHTML.setAttribute('onclick', 'Timetable.getInstance().addTimetableLecture("' + this.id + '")');
        lectureHTML.setAttribute('onmouseover', 'Timetable.getInstance().setSelectLecture("' + this.id + '")');
        lectureHTML.setAttribute('onmouseout', 'Timetable.getInstance().setSelectLecture(null)');
        if (!this._loading) {
            lectureHTML.innerHTML = '<span class="label label-default">' + this.id + '</span> Loading...';
        }
        else {
            lectureHTML.innerHTML = '<span class="label label-default">' + this.id + '</span> ' + this.subject_name;
        }
        if (create) {
            viewer.appendChild(lectureHTML);
        }
    };
    Lecture.prototype.showTimetableGeneratorRequestLecture = function () {
        var viewer = document.getElementById('timetable_generator_request_lectures');
        var lectureHTML = document.createElement('button');
        lectureHTML.setAttribute('class', 'list-group-item');
        lectureHTML.setAttribute('onclick', 'Timetable.getInstance().removeTimetableGeneratorRequestLecture("' + this.id + '")');
        lectureHTML.setAttribute('onmouseover', 'Timetable.getInstance().setSelectLecture("' + this.id + '")');
        lectureHTML.setAttribute('onmouseout', 'Timetable.getInstance().setSelectLecture(null)');
        lectureHTML.innerHTML = '<span class="label label-default">' + this.id + '</span> ' + this.subject_name;
        viewer.appendChild(lectureHTML);
    };
    Lecture.prototype.showTimetable = function () {
        if (this.timetable.length < 1) {
            var group = document.getElementById('timetable_etc_item_group');
            var item = document.createElement('span');
            item.setAttribute('role', 'button');
            item.setAttribute('class', 'timetable-etc-item');
            item.setAttribute('style', 'border-color:#1587BD;background-color:#9FC6E7;color:#1d1d1d;');
            item.setAttribute('onclick', 'Timetable.getInstance().removeTimetableLecture("' + this.id + '")');
            item.setAttribute('onmouseover', 'Timetable.getInstance().setSelectLecture("' + this.id + '")');
            item.setAttribute('onmouseout', 'Timetable.getInstance().setSelectLecture(null)');
            item.innerHTML = this.subject_name + ' (' + this.id + ')';
            group.appendChild(item);
        }
        else {
            for (var i = 0; i < this.timetable.length; i++) {
                var time = this.timetable[i];
                var group = document.getElementById('timetable_time_item_group_' + time.getWeekdayCode());
                if (!group)
                    continue;
                var margin_top = (time.getDayStartTime() - 60 * 60 * 24) / 60;
                var height = (time.getDayEndTime() - time.getDayStartTime()) / 60;
                var item = document.createElement('div');
                item.setAttribute('role', 'button');
                item.setAttribute('class', 'timetable-time-item');
                item.setAttribute('style', 'margin-top:' + margin_top + 'px; height:' + height + 'px; border-color:#1587BD;background-color:#9FC6E7;color:#1d1d1d;');
                item.setAttribute('onclick', 'Timetable.getInstance().removeTimetableLecture("' + this.id + '")');
                item.setAttribute('onmouseover', 'Timetable.getInstance().setSelectLecture("' + this.id + '")');
                item.setAttribute('onmouseout', 'Timetable.getInstance().setSelectLecture(null)');
                var html = '<p><span class="timetable-time-item-subject">' + this.subject_name + '</span>';
                html += '<span> ' + this.id + '</span></p>';
                html += '<p><span>' + this.professors.join(',') + ' </span>';
                if (time.place) {
                    html += '<span>' + time.place.name + time.place.room + '</span>';
                }
                html += '</p>';
                item.innerHTML = html;
                group.appendChild(item);
            }
        }
    };
    Lecture.prototype.showInfo = function () {
        document.getElementById('lecture_info').removeAttribute('style');
        document.getElementById('lecture_info_subject_name').innerHTML = this.subject_name;
        document.getElementById('lecture_info_id').innerHTML = this.id;
        document.getElementById('lecture_info_professors').innerHTML = this.professors.join(',');
        document.getElementById('lecture_info_departments').innerHTML = Timetable.getInstance().getDepartmentNames(this.departments).join(',');
        var timetable = document.getElementById('lecture_info_timetable');
        timetable.innerHTML = '';
        function create_time(time_info) {
            var time = document.createElement('div');
            time.setAttribute('class', 'lecture-info-timetable-data');
            if (time_info.time) {
                time.innerHTML = '<p>' + time_info.getWeekdayString() + '요일 ' + time_info.getStartTimeString() + '~' + time_info.getEndTimeString() + '</p>';
            }
            if (time_info.place) {
                time.innerHTML += '<p>' + time_info.place.name + ' ' + time_info.place.room + '</p>';
            }
            timetable.appendChild(time);
        }
        for (var i = 0; i < this.timetable.length; i++) {
            create_time(this.timetable[i]);
        }
        var tags = document.getElementById('lecture_info_tags');
        tags.innerHTML = '';
        function create_tag(name) {
            var tag = document.createElement('span');
            tag.setAttribute('class', 'label label-default lecture-info-tag');
            tag.innerHTML = name;
            tags.appendChild(tag);
        }
        create_tag(this.type);
        create_tag(this.credit + '학점');
        if (this.grade) {
            create_tag(this.grade + '학년');
        }
        for (var i = 0; i < this.tags.length; i++) {
            create_tag(this.tags[i]);
        }
        var links = document.getElementById('lecture_info_links');
        links.innerHTML = '';
        function create_link(name, url) {
            var link = document.createElement('li');
            link.innerHTML = '<a href="' + url + '" target="_bleak">' + name + '</a></li>';
            links.appendChild(link);
        }
        for (var i = 0; i < this.links.length; i++) {
            create_link(this.links[i].name, this.links[i].url);
        }
    };
    return Lecture;
})();
var Timetable = (function () {
    function Timetable() {
        this._campus = [];
        this._year = [];
        this._department = [];
        this._lectures = {};
        this._hashinfo = {
            'campus': null,
            'year': null,
            'term': null,
            'lectures': []
        };
        this._selectLecture = null;
        this._timetableLectures = [];
        this._currentCampus = null;
        this._currentYear = null;
        this._currentTerm = null;
        this._timetableGeneratorState = false;
        this._timetableGeneratorRequestLectures = [];
        this._timetableGeneratorTimetableList = [];
        this._timetableGeneratorTimetableIndex = 0;
    }
    Timetable.getInstance = function () {
        return Timetable._instance;
    };
    Timetable.prototype.init = function () {
        var hash_split = window.location.hash.split('/');
        if (hash_split.length > 4 && !isNaN(hash_split[2]) && !isNaN(hash_split[3])) {
            this._hashinfo.campus = hash_split[1];
            this._hashinfo.year = Number(hash_split[2]);
            this._hashinfo.term = Number(hash_split[3]);
            this._hashinfo.lectures = hash_split[4].split(',');
        }
        $.get('data/campus.json', function (data) {
            if (data.length < 1) {
                alert('캠퍼스 데이터 로드에 실패하였습니다.');
                return;
            }
            for (var i = 0; i < data.length; i++) {
                Timetable.getInstance().addCampus(data[i]);
            }
            Timetable.getInstance().updateCampusListHTML();
            if (Timetable.getInstance()._hashinfo.campus) {
                Timetable.getInstance().setCurrentCampus(Timetable.getInstance()._hashinfo.campus);
                Timetable.getInstance()._hashinfo.campus = null;
            }
            else {
                Timetable.getInstance()._hashinfo.year = null;
                Timetable.getInstance()._hashinfo.term = null;
                Timetable.getInstance().setCurrentCampus(data[0].id);
            }
        });
    };
    Timetable.prototype.addCampus = function (campus_info) {
        this._campus.push(new Campus(campus_info));
    };
    Timetable.prototype.updateCampusListHTML = function () {
        var viewer = document.getElementById('campus_list');
        viewer.innerHTML = '';
        for (var i = 0; i < this._campus.length; i++) {
            var campus = this._campus[i];
            var campusHTML = document.createElement('button');
            campusHTML.setAttribute('type', 'button');
            campusHTML.setAttribute('class', 'list-group-item');
            campusHTML.setAttribute('onclick', 'Timetable.getInstance().setCurrentCampus("' + campus.getId() + '")');
            campusHTML.innerHTML = campus.getUnivName() + ' (' + campus.getCampusName() + ')';
            viewer.appendChild(campusHTML);
        }
    };
    Timetable.prototype.getCampusById = function (campus_id) {
        for (var i = 0; i < this._campus.length; i++) {
            if (this._campus[i].id == campus_id)
                return this._campus[i];
        }
        return null;
    };
    Timetable.prototype.getCurrentCampus = function () {
        return this._currentCampus;
    };
    Timetable.prototype.setCurrentCampus = function (campus_id) {
        var campus = this.getCampusById(campus_id);
        document.getElementById('campus_name').innerHTML = campus.getUnivName() + ' (' + campus.getCampusName() + ')';
        $('#select_campus').modal('hide');
        this._currentCampus = campus;
        this._year = [];
        this._department = [];
        this._lectures = {};
        this._timetableLectures = [];
        if (!this._hashinfo.year) {
            $.get('data/' + this.getCurrentCampus().getId() + '/default.json', function (data) {
                Timetable.getInstance().setCurrentTerm(data.year, data.term);
                Timetable.getInstance().updateTermHTML(data.year);
            });
        }
        else {
            var year = this._hashinfo.year;
            var term = this._hashinfo.term;
            this._hashinfo.year = null;
            Timetable.getInstance().setCurrentTerm(year, term);
            Timetable.getInstance().updateTermHTML(year);
        }
    };
    Timetable.prototype.setCurrentTerm = function (year, term) {
        this._department = [];
        this._lectures = {};
        this._timetableLectures = [];
        this._currentYear = year;
        this._currentTerm = term;
        $.get('data/' + this.getCurrentCampus().getId() + '/' + year + '/term.json', function (data) {
            for (var i = 0; i < data.length; i++) {
                if (data[i].id == term) {
                    document.getElementById('term_name').innerHTML = year + ' 년 ' + data[i].name + '학기';
                    return;
                }
            }
        });
        $.get('data/' + this.getCurrentCampus().getId() + '/' + year + '/' + term + '/department.json', function (data) {
            for (var i = 0; i < data.length; i++) {
                Timetable.getInstance().addDepartment(data[i]);
            }
            Timetable.getInstance().updateDepartmentListHTML();
            Timetable.getInstance().selectDepartment(data[0].id);
        });
        if (this._hashinfo.lectures.length > 0) {
            for (var i = 0; i < this._hashinfo.lectures.length; i++) {
                var lecture_id = this._hashinfo.lectures[i];
                if (!this._lectures[lecture_id]) {
                    this._lectures[lecture_id] = new Lecture(this.getCurrentCampus().getId(), this._currentYear, this._currentTerm, lecture_id);
                    this._lectures[lecture_id].update();
                    this._timetableLectures.push(this._lectures[lecture_id]);
                }
            }
            this._hashinfo.lectures = [];
        }
    };
    Timetable.prototype.updateTermHTML = function (year) {
        document.getElementById('input_year').value = year;
        var input_term = document.getElementById('input_term');
        input_term.innerHTML = '<option>Loading...</option>';
        $.get('data/' + this.getCurrentCampus().getId() + '/' + year + '/term.json', function (data) {
            input_term.innerHTML = '';
            for (var i = 0; i < data.length; i++) {
                var term = document.createElement('option');
                term.setAttribute('value', data[i].id);
                term.innerHTML = data[i].name;
                input_term.appendChild(term);
            }
        });
    };
    Timetable.prototype.addDepartment = function (depart_info) {
        this._department.push(new Department(depart_info));
    };
    Timetable.prototype.updateDepartmentListHTML = function () {
        var viewer = document.getElementById('department_list');
        viewer.innerHTML = '';
        for (var i = 0; i < this._department.length; i++) {
            var department = this._department[i];
            var departmentHTML = document.createElement('option');
            departmentHTML.setAttribute('value', department.getId());
            departmentHTML.innerHTML = department.getName();
            viewer.appendChild(departmentHTML);
        }
    };
    Timetable.prototype.selectDepartment = function (depart_id) {
        $.get('data/' + this.getCurrentCampus().getId() + '/' + this._currentYear + '/' + this._currentTerm + '/lecture_department_index/' + depart_id + '.json', function (data) {
            var viewer = document.getElementById('search_results');
            viewer.innerHTML = '';
            for (var i = 0; i < data.length; i++) {
                Timetable.getInstance().showLectureList(data[i]);
            }
        });
    };
    Timetable.prototype.getDepartmentNames = function (depart_ids) {
        var names = [];
        for (var i = 0; i < this._department.length; i++) {
            for (var id_i = 0; id_i < depart_ids.length; id_i++) {
                if (this._department[i].getId() == depart_ids[i]) {
                    names.push(this._department[i].getName());
                }
            }
        }
        return names;
    };
    Timetable.prototype.showLectureList = function (lecture_id) {
        if (!this._lectures[lecture_id]) {
            this._lectures[lecture_id] = new Lecture(this.getCurrentCampus().getId(), this._currentYear, this._currentTerm, lecture_id);
            this._lectures[lecture_id].update();
        }
        this._lectures[lecture_id].showResultList(true);
    };
    Timetable.prototype.getLecture = function (lecture_id) {
        return this._lectures[lecture_id];
    };
    Timetable.prototype.setSelectLecture = function (lecture_id) {
        var lecture = this.getLecture(lecture_id);
        this._selectLecture = lecture;
        if (lecture) {
            lecture.showInfo();
        }
        this.updateShowLectures();
    };
    Timetable.prototype.addTimetableLecture = function (lecture_id) {
        var lecture = this.getLecture(lecture_id);
        if (lecture == null)
            return;
        if (this._timetableGeneratorState) {
            this.addTimetableGeneratorRequestLecture(lecture);
            return;
        }
        for (var i = 0; i < this._timetableLectures.length; i++) {
            if (this._timetableLectures[i].getSubjectCode() == lecture.getSubjectCode()) {
                alert('동일한 과목 코드가 이미 존재합니다. - ' + this._timetableLectures[i].getSubjectName() + ' (' + this._timetableLectures[i].getSubjectCode() + ')');
                return;
            }
            if (this._timetableLectures[i].overlapTime(lecture)) {
                alert('시간이 중복됩니다. - ' + this._timetableLectures[i].getSubjectName() + ' (' + this._timetableLectures[i].getSubjectCode() + ')');
                return;
            }
        }
        this._timetableLectures.push(lecture);
        this.updateShowLectures();
    };
    Timetable.prototype.removeTimetableLecture = function (lecture_id) {
        for (var i = 0; i < this._timetableLectures.length; i++) {
            var lecture = this._timetableLectures[i];
            if (lecture.getId() == lecture_id) {
                this._timetableLectures.splice(i, 1);
                if (lecture == this._selectLecture)
                    this._selectLecture = null;
                this.updateShowLectures();
                return;
            }
        }
    };
    Timetable.prototype.updateShowLectures = function () {
        for (var i = 0; i < 7; i++)
            document.getElementById('timetable_time_item_group_' + i).innerHTML = '';
        document.getElementById('timetable_etc_item_group').innerHTML = '';
        var select_lecture = this._selectLecture;
        var lecture_ids = [];
        for (var i = 0; i < this._timetableLectures.length; i++) {
            this._timetableLectures[i].showTimetable();
            if (select_lecture == this._timetableLectures[i])
                select_lecture = null;
            lecture_ids.push(this._timetableLectures[i].getId());
        }
        if (select_lecture) {
            select_lecture.showTimetable();
        }
        window.location.hash = '#/' + this.getCurrentCampus().getId() + '/' + this._currentYear + '/' + this._currentTerm + '/' + lecture_ids.join(',');
    };
    Timetable.prototype.setTimetableGeneratorState = function (state) {
        this._timetableGeneratorState = state;
    };
    Timetable.prototype.addTimetableGeneratorRequestLecture = function (lecture) {
        if (!lecture.isLoad())
            return;
        this._timetableGeneratorRequestLectures.push(lecture);
        this.updateTimetableGenerator();
    };
    Timetable.prototype.removeTimetableGeneratorRequestLecture = function (lecture_id) {
        for (var i = 0; i < this._timetableGeneratorRequestLectures.length; i++) {
            var lecture = this._timetableGeneratorRequestLectures[i];
            if (lecture.getId() == lecture_id) {
                this._timetableGeneratorRequestLectures.splice(i, 1);
                if (lecture == this._selectLecture)
                    this._selectLecture = null;
                this.updateShowLectures();
                this.updateTimetableGenerator();
                return;
            }
        }
    };
    Timetable.prototype.updateTimetableGenerator = function () {
        document.getElementById('timetable_generator_request_lectures').innerHTML = '';
        for (var i = 0; i < this._timetableGeneratorRequestLectures.length; i++) {
            this._timetableGeneratorRequestLectures[i].showTimetableGeneratorRequestLecture();
        }
        var html = (this._timetableGeneratorTimetableIndex + 1) + '/' + this._timetableGeneratorTimetableList.length;
        if (this._timetableGeneratorTimetableList.length == 0)
            html = '0/0';
        document.getElementById('timetable_generator_index_viewer').innerHTML = html;
    };
    Timetable.prototype.generateTimetable = function () {
        var min_credit = document.getElementById('timetable_generator_min_credit').value;
        var max_credit = document.getElementById('timetable_generator_max_credit').value;
        if (min_credit == '')
            min_credit = 17;
        if (max_credit == '')
            max_credit = 21;
        if (isNaN(min_credit)) {
            alert('최소 학점이 잘못되었습니다');
            return;
        }
        if (isNaN(max_credit)) {
            alert('최대 학점이 잘못되었습니다');
            return;
        }
        min_credit = Number(min_credit);
        max_credit = Number(max_credit);
        if (min_credit < 1) {
            alert('최소 학점은 1보다 작을 수 없습니다');
            return;
        }
        if (max_credit < min_credit) {
            alert('최대 학점은 최소학점보다 작을 수 없습니다');
            return;
        }
        var subject_list = [];
        for (var lecture_i = 0; lecture_i < this._timetableGeneratorRequestLectures.length; lecture_i++) {
            var lecture = this._timetableGeneratorRequestLectures[lecture_i];
            var mask = true;
            for (var list_i = 0; list_i < subject_list.length && mask; list_i++) {
                if (subject_list[list_i][0].getSubjectCode() == lecture.getSubjectCode()) {
                    subject_list[list_i].push(lecture);
                    mask = false;
                }
            }
            if (mask) {
                subject_list.push([lecture]);
            }
        }
        var tempTimetableList = [];
        // 부분 집합 생성
        function gen_subset(arr, index, necessary_count) {
            var subject = subject_list[index];
            for (var i = 0; i < subject.length; i++) {
                var subset = arr.slice(0);
                subset.push(subject[i]);
                if (necessary_count > 1) {
                    for (var next = index + 1; next < subject_list.length; next++) {
                        gen_subset(subset, next, necessary_count - 1);
                    }
                }
                else {
                    tempTimetableList.push(subset);
                }
            }
        }
        for (var lecture_count = subject_list.length; lecture_count > 0; lecture_count--) {
            for (var start_index = 0; start_index <= subject_list.length - lecture_count; start_index++) {
                gen_subset([], start_index, lecture_count);
            }
        }
        this._timetableGeneratorTimetableList = [];
        var timetable = this;
        // 해당 조합이 조건에 맞는 시간표이면 추가
        function saveTimetable(lectures) {
            // 전체 학점 계산
            var credit_sum = 0;
            for (var lecture_i = 0; lecture_i < lectures.length; lecture_i++)
                credit_sum += lectures[lecture_i].getCredit();
            if (min_credit > credit_sum)
                return;
            if (max_credit < credit_sum)
                return;
            for (var lecture1_i = 0; lecture1_i < lectures.length; lecture1_i++) {
                for (var lecture2_i = lecture1_i + 1; lecture2_i < lectures.length; lecture2_i++) {
                    if (lectures[lecture1_i].overlapTime(lectures[lecture2_i]))
                        return;
                }
            }
            timetable._timetableGeneratorTimetableList.push(lectures);
        }
        for (var i = 0; i < tempTimetableList.length; i++) {
            saveTimetable(tempTimetableList[i]);
        }
        this._timetableGeneratorTimetableIndex = 0;
        this.setTimetableGeneratorTimetableIndex(0);
        this.updateTimetableGenerator();
    };
    Timetable.prototype.setTimetableGeneratorTimetableIndex = function (index) {
        if (this._timetableGeneratorTimetableList.length <= index) {
            alert('해당 시간표를 표시할 수 없거나 생성된 시간표가 존재하지 않습니다');
            return;
        }
        this._timetableGeneratorTimetableIndex = index;
        this._timetableLectures = this._timetableGeneratorTimetableList[index];
        this.updateTimetableGenerator();
        this.updateShowLectures();
    };
    Timetable.prototype.previousTimetableGeneratorTimetable = function () {
        this.setTimetableGeneratorTimetableIndex(this._timetableGeneratorTimetableIndex - 1);
    };
    Timetable.prototype.nextTimetableGeneratorTimetable = function () {
        this.setTimetableGeneratorTimetableIndex(this._timetableGeneratorTimetableIndex + 1);
    };
    Timetable._instance = new Timetable();
    return Timetable;
})();
//# sourceMappingURL=timetable.js.map