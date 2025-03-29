function updateDigitalClock() {
    const now = new Date();

    // 获取当前时间
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    // 更新数字表
    document.getElementById("hours").textContent = hours;
    document.getElementById("minutes").textContent = minutes;

    // 获取当前日期
    const options = { year: "numeric", month: "long", day: "numeric" };
    const currentDate = now.toLocaleDateString("en-US", options);
    document.getElementById("current-date").textContent = currentDate;
}

// 每分钟更新一次时间
setInterval(updateDigitalClock, 10000);
updateDigitalClock();