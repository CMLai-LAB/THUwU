let SEMESTER = "1";
let YEAR = "113";
fetch(`semesterConfig.json`)
	.then(r => r.json())
	.then(data => {
		SEMESTER = data["SEMESTER"];
		YEAR = data["YEAR"];
		document.getElementById('semester-tag').innerHTML = `${YEAR} 學年度 第 ${SEMESTER} 學期`;
		document.getElementById('semester-tag').href = `https://course.thu.edu.tw/view-dept/${YEAR}/${SEMESTER}`;
	});


const TIME_MAPPING = {
	'A': "7:10 ~ 8:00",
	1: "8:10 ~ 9:00",
	2: "9:10 ~ 10:00",
	3: "10:20 ~ 11:10",
	4: "11:20 ~ 12:10",
	'B': "12:10 ~ 13:00",
	5: "13:10 ~ 14:00",
	6: "14:10 ~ 15:00",
	7: "15:20 ~ 16:10",
	8: "16:20 ~ 17:10",
	9: "17:20 ~ 18:10",
	10: "18:20 ~ 19:10",
	11: "19:20 ~ 20:10",
	12: "20:20 ~ 21:10",
	13: "21:20 ~ 22:10",
}
function compareTimeIdx(a, b) {
	if (Number.isFinite(a) && Number.isFinite(b)) {
		return parseFloat(a) - parseFloat(b);
	} else {
		let a_val = a, b_val = b;
		if (a === 'A') {
			a_val = 0;
		}
		if (b === 'A') {
			b_val = 0;
		}
		if (a === 'B') {
			a_val = 4.5;
		}
		if (b === 'B') {
			b_val = 4.5;
		}

		return parseFloat(a_val) - parseFloat(b_val);
	}
}

const TIME_IDX = Object.keys(TIME_MAPPING).sort(compareTimeIdx);

const WEEK_MAPPING = {
	"一": 1,
	"二": 2,
	"三": 3,
	"四": 4,
	"五": 5,
	"六": 6,
	"日": 7,
}

const APP_URL = `${location.protocol}//${location.host}${location.pathname}`;
