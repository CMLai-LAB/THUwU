let courseData = {};
let depData = {};
let selectedCourse = {};
let selectedDep = "0";

// Safari sucks.

const supportBigInt = typeof BigInt !== "undefined";
if (!supportBigInt) BigInt = JSBI.BigInt;

function parseBigInt(value, radix = 36) {
    const add = (a, b) => supportBigInt ? a + b : JSBI.add(a, b);
    const mul = (a, b) => supportBigInt ? a * b : JSBI.multiply(a, b);
    return [...value.toString()]
        .reduce((r, v) =>
            add(
                mul(r, BigInt(radix)),
                BigInt(parseInt(v, radix)),
            ), BigInt(0));
}

function loadFromShareLink() {
    const shareKey = new URLSearchParams(location.search).get("share");
    const courseIds = parseBigInt(shareKey).toString().match(/.{1,4}/g);
    return courseIds.reduce((a, b) => (a[b] = true, a), {});
}

function loadFromLocalStorage() {
    return JSON.parse(localStorage.getItem("selectedCourse")) || {};
}

const totalCredits = () =>
    Object.keys(selectedCourse).reduce(
        (accu, id) => +courseData[id].credit + accu,
        0,
    );

let share = false;
if (location.search.includes("share=")) {
    share = true;
    document.querySelector(".sidebar").classList.add("is-hidden");
    document.querySelector("#import").classList.remove("is-hidden");
    document.querySelector(".loading").classList.remove("is-hidden");
}

// Render timetable.
TIME_IDX.forEach((period) => {
    const div = document.createElement("div");
    div.textContent = `${period} / ${TIME_MAPPING[period]}`;
    document.querySelector(".time-interval").appendChild(div);
});

TIME_IDX.forEach((period) => {
    for (let day = 1; day <= 7; ++day) {
        const div = document.createElement("div");
        div.id = `${day}${period}`;
        document.querySelector(".content").appendChild(div);
    }
});

// Fetch department data and render department list
fetch(`course-data/${YEAR}${SEMESTER}-dep-data.json`)
    .then((r) => r.json())
    .then((data) => {
        depData = data;
        const groupedDepartments = Object.entries(depData).reduce((acc, [key, value]) => {
            const groupKey = value.college; // or any other attribute you want to group by
            if (!acc[groupKey]) {
                acc[groupKey] = [];
            }
            acc[groupKey].push({ key, value });
            return acc;
        }, {});
        Object.keys(groupedDepartments).forEach((college) => {
            const optGroup = document.createElement("optgroup");
            optGroup.label = college;
            groupedDepartments[college].forEach((dep) => {
                const option = new Option(dep.value.name, dep.key);
                optGroup.appendChild(option);
            });
            document.querySelector("#department-dropdown").appendChild(optGroup);
        });
    });

// Fetch course data.
fetch(`course-data/${YEAR}${SEMESTER}-data.json`)
    .then((r) => r.json())
    .then((data) => {
        courseData = data;
        selectedCourse = share ? loadFromShareLink() : loadFromLocalStorage();

        document.querySelector("#search-bar").disabled = false;
        document.querySelector("#search-bar").placeholder =
            "課號 / 課名 / 老師 / 備註";
        document.querySelector(".loading").classList.add("is-hidden");
        for (courseId in selectedCourse) {
            const course = courseData[courseId];
            renderPeriodBlock(course);
            appendCourseElement(course);
        }
        document.querySelector(".credits").textContent = `${totalCredits()} 學分`;
    });

function getCourseIdFromElement(element) {
    return element.closest(".course,.period").dataset.id;
}

function getDepartmentIdFromElement(element) {
    return element.closest("select").value;
}

document.addEventListener("click", function({ target }) {
    if (target.classList.contains("toggle-course")) {
        toggleCourse(getCourseIdFromElement(target));
    }

    if (target.classList.contains("modal-launcher")) {
        openModal(getCourseIdFromElement(target));
    }
});

document.addEventListener("mouseover", function(event) {
    if (event.target.matches(".result .course, .result .course *")) {
        const courseId = getCourseIdFromElement(event.target);
        const result = parseTime(courseData[courseId].time);
        result.forEach((period) => {
            const block = document.getElementById(period);
            if (block.childElementCount) {
                block.firstElementChild.classList.add(
                    "has-background-danger",
                    "has-text-white",
                );
            }
            block.classList.add("has-background-info-light");
        });
    }
});

document.addEventListener("mouseout", function(event) {
    if (event.target.matches(".result .course, .result .course *")) {
        document.querySelectorAll(
            '.timetable>.content>[class="has-background-info-light"]',
        )
            .forEach((elem) => {
                elem.className = "";
                elem.firstElementChild?.classList.remove(
                    "has-background-danger",
                    "has-text-white",
                );
            });
    }
});

function openModal(courseId) {
    const modal = document.querySelector(".modal");
    modal.classList.add("is-active");

    const data = courseData[courseId];
    const fields = modal.querySelectorAll("dd");
    fields[0].textContent = data.id;
    fields[1].textContent = depData[data.department_id].name;
    fields[2].textContent = data.credit;
    fields[3].textContent = data.teacher;
    fields[4].textContent = data.time;
    fields[5].textContent = data.brief;
    fields[6].textContent = data.description;
    fields[7].querySelector("tbody").innerHTML = "";
    data.grading.forEach((grading) => {
        fields[7].querySelector("tbody").innerHTML += `
    	<tr>
    	<td>${grading.target}</td>
    	<td>${grading.ratio}</td>
    	<td>${grading.description}</td>
	</tr>
    	`;
    });

    modal.querySelector(".card-header-title").textContent = data.type + "-" +
        data.name;
    modal.querySelector("#outline").href = data.url;
}

function appendCourseElement(course, search = false) {
    const template = document.getElementById("courseTemplate");
    template.content.getElementById("id-tag").textContent = course.id;

    // Set course block according to course type
    let type_tag = template.content.getElementById("type-tag");
    type_tag.textContent = course.type;
    type_tag.className = (course.type === "必修")
        ? "tag is-rounded is-danger"
        : "tag is-rounded is-white";
    type_tag.className = (course.type === "必選")
        ? "tag is-rounded is-info"
        : type_tag.className;

    template.content.getElementById("name").textContent = course.name;
    template.content.getElementById("detail").textContent =
        `${course.teacher}・${+course.credit} 學分`;
    template.content.querySelector(".course").dataset.id = course.id;
    template.content.querySelector(".toggle-course").classList.toggle(
        "is-selected",
        course.id in selectedCourse,
    );

    const clone = document.importNode(template.content, true);
    document.querySelector(search ? ".result" : ".selected").appendChild(clone);
}

function search(searchTerm) {
    if (!searchTerm && !selectedDep) return [];

    const regex = RegExp(searchTerm, "i");
    const result = Object.values(courseData)
        .filter((course) => (
            (selectedDep === "0") ? true : course.department_id === selectedDep
        ))
        .filter((course) => (
            course.id.match(regex) ||
            course.teacher.match(regex) ||
            course.name.match(regex) ||
            course.brief.match(regex) ||
            depData[course.department_id].name.match(regex)
        ))
        .slice(0, 50);

    return result;
}

function toggleCourse(courseId) {
    const button = document.querySelector(
        `.course[data-id="${courseId}"] .toggle-course`,
    );
    if (courseId in selectedCourse) { // Remove course
        delete selectedCourse[courseId];

        document.querySelector(`.selected [data-id="${courseId}"]`).remove();
        document.querySelectorAll(`.period[data-id="${courseId}"]`).forEach(
            (elem) => elem.remove()
        );
        button?.classList.remove("is-selected");
    } else { // Select course
        if (courseData[courseId].time === "無資料") {
            Toastify({
                text: "此課程無上課時間資料，無法加入課表",
                backgroundColor: "linear-gradient(147deg, #f71735 0%, #db3445 74%)",
                close: true,
                duration: 3000,
            }).showToast();
            return;
        }
        const periods = parseTime(courseData[courseId].time);
        const isConflict = periods.some((period) =>
            document.getElementById(period).childElementCount
        );
        if (isConflict) {
            Toastify({
                text: "和目前課程衝堂了欸",
                backgroundColor: "linear-gradient(147deg, #f71735 0%, #db3445 74%)",
                close: true,
                duration: 3000,
            }).showToast();
            return;
        }

        selectedCourse[courseId] = true;
        appendCourseElement(courseData[courseId]);
        renderPeriodBlock(courseData[courseId]);
        button?.classList.add("is-selected");
    }

    localStorage.setItem("selectedCourse", JSON.stringify(selectedCourse));
    document.querySelector(".credits").textContent = `${totalCredits()} 學分`;
}

function parseTime(timeCode) {
    const timeList = timeCode.match(
        /[\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u65E5]\/(([0-9]+)|([AB]))(\,(([0-9]+)|([AB])))*/g,
    );

    return timeList.map(function(code) {
        let time_arr = code.split("/")[1].split(",");
        return time_arr.map((time) => WEEK_MAPPING[code[0]] + time);
    }).flat();
}

function renderPeriodBlock(course) {
    const periods = parseTime(course.time);
    periods.forEach((period) =>
        document.getElementById(period).innerHTML = `
    <div data-id="${course.id}" class="period modal-launcher">
        <span>${course.name}</span>
    </div>`
    );
}

document.querySelector("#search-bar").oninput = (event) => {
    document.querySelector(".result").innerHTML = "";

    const searchTerm = event.target.value.trim();

    const result = search(searchTerm);

    result.forEach((course) => appendCourseElement(course, true));
};

document.querySelector("#department-dropdown").onchange = function(
    { target },
) {
    selectedDep = getDepartmentIdFromElement(target);
    const searchTerm = document.querySelector("#search-bar").value.trim();
    document.querySelector(".result").innerHTML = "";

    const result = search(searchTerm);
    result.forEach((course) => appendCourseElement(course, true));
};

document.getElementById("import").onclick = () => {
    if (confirm("接下來將會覆蓋你的目前課表ㄛ，確定嗎？")) {
        localStorage.setItem("selectedCourse", JSON.stringify(selectedCourse));
        Toastify({
            text: "匯入完成！點此前往選課模擬",
            destination: APP_URL,
            close: true,
            duration: 3000,
        }).showToast();
    }
};

document.getElementById("copy-link").onclick = () => {
    const shareKey = BigInt(Object.keys(selectedCourse).join("")).toString(36);

    const link = `${APP_URL}?share=${shareKey}`;
    const copy = document.createElement("div");
    copy.textContent = link;
    document.body.appendChild(copy);

    const textRange = document.createRange();
    textRange.selectNode(copy);
    const selet = window.getSelection();
    selet.removeAllRanges();
    selet.addRange(textRange);

    try {
        document.execCommand("copy");

        Toastify({
            text: "複製好了！點此可直接前往",
            destination: link,
            newWindow: true,
            close: true,
            duration: 3000,
        }).showToast();
    } catch (err) {
        console.log("Oops, unable to copy");
    }

    document.body.removeChild(copy);
};

document.getElementById("download-link").onclick = () => {
    document.querySelectorAll("#main-table").forEach((table_element) => {
        table_element.classList.add("bg-white");
    });
    document.querySelectorAll(".btn-outline-light").forEach((table_element) => {
        table_element.classList.remove("btn-outline-light");
        table_element.classList.add("btn-outline-dark");
    });
    setTimeout(function() {
        let table = document.getElementById("main-table");
        domtoimage.toPng(table)
            .then(function(dataURL) {
                var link = document.createElement("a");
                link.href = dataURL;
                link.download = YEAR + "-" + SEMESTER + "_timetable.png";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
    }, 500);
};

document.getElementById("clear-table").onclick = () => {
    const selectedDom =
        document.getElementsByClassName("selected course-list")[0];
    const courseDoms = selectedDom.getElementsByClassName(
        "toggle-course is-selected",
    );

    if (courseDoms.length === 0) {
        Toastify({
            text: "您尚未選課，無法清空課表",
            backgroundColor: "linear-gradient(147deg, #f71735 0%, #db3445 74%)",
            close: true,
            duration: 3000,
        }).showToast();
    } else {
        let cnt = courseDoms.length;
        while (cnt-- > 0) courseDoms[0].click();

        Toastify({
            text: "已清空課表!",
            // Use pastel blue color
            backgroundColor: "linear-gradient(147deg, #00d2ff 0%, #3a7bd5 74%)",
            close: true,
            duration: 3000,
        }).showToast();
    }
};

document.querySelector(".modal-background").onclick =
    document.querySelector(".card-header-icon").onclick =
    () => document.querySelector(".modal").classList.remove("is-active");
