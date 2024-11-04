const webSocketURL =
  "wss://dtgesfopsa.execute-api.eu-west-2.amazonaws.com/production/";
const webSocket = new WebSocket(webSocketURL);

const linkedinRegex = /^.*(linkedin\.com\/in\/[a-z0-9-]+).*$/;

let typeQueue = [];
let midQueue = false;
/**
 * Set this variable to `true` to void the current typing operation. This won't erase any typed characters, but just halt any ongoing typing. This will be automatically reset to `false` after each cancelled type request (the full message to be typed, not each character)
 */
let cancelTyping = false;

/**
 * Types out a given piece of text to the target element's text component, in the 'typewriter' style, wherein each character appears individually after a specified delay, in milliseconds.
 *
 * @param {*} text The string to be typed out
 * @param {*} target The target element, containing an `innerHTML` component
 * @param {*} append If the text should be appended to the current contents of the element. If true, the text will be appended. If false, the contents are initially reset, then typing ensues
 * @param {*} delayMs The delay, in milliseconds, between the typing of each character in the text parameter
 * @returns A Promise that executes the typing operation, and resolves once typing is complete
 */
function typewriter(text, target, append, delayMs) {
  if (!delayMs) delayMs = 50;
  if (!append) target.innerHTML = "";

  let timeoutId;

  function __typewriter(loopCount, resolve) {
    if (cancelTyping) {
      clearTimeout(timeoutId);
      resolve();
      return;
    }

    timeoutId = setTimeout(() => {
      const pointer = text.length - loopCount;
      target.innerHTML = target.innerHTML.replace(/_$/, "");

      if (!cancelTyping) {
        if (append) target.innerHTML += text.charAt(pointer);
        else target.innerHTML = text.substring(0, pointer);
      }
      target.innerHTML += "_";

      if (loopCount > 0) __typewriter(loopCount - 1, resolve);
      else {
        target.innerHTML = target.innerHTML.replace(/_$/, "");
        resolve();
      }
    }, delayMs);
  }

  return new Promise((resolve) => {
    midQueue = true;
    __typewriter(text.length, resolve);
  });
}

/**
 * Enqueues a message to be typed out to the text component of the target element. Typing is performed in the 'typewriter' style. The queue is automatically processed as soon as entries enter.
 * @param {*} text The string to be typed out
 * @param {*} target The target element, containing an `innerHTML` component
 * @param {*} append If the text should be appended to the current contents of the element. If true, the text will be appended. If false, the contents are initially reset, then typing ensues
 * @param {*} delayMs The delay, in milliseconds, between the typing of each character in the text parameter
 * @see typewriter
 */
function awaitTyping(text, target, append, delayMs) {
  const typewriterFunction = () => {
    cancelTyping = false;
    return typewriter(text, target, append, delayMs)
      .then(() => {
        midQueue = false;
        if (typeQueue.length > 0) {
          typeQueue.shift()();
        }
      })
      .catch((error) => {
        midQueue = false;
        console.error(error);
        if (typeQueue.length > 0) {
          typeQueue.shift()();
        }
      });
  };

  typeQueue.push(typewriterFunction);

  if (!midQueue) {
    midQueue = true;
    typeQueue.shift()();
  }
}
/**
 * Takes in a target button, and toggles its enabled/disabled state, including adjusting its CSS so it appears disabled.
 *
 * @param {Element} tryNowButton The button to be toggled
 * @param {Event} event The event that triggered the invocation of this method
 */
function toggleTryNowButton(tryNowButton, event) {
  const currentValue = event.target.value;

  if (!linkedinRegex.test(currentValue)) {
    tryNowButton.classList.add("bg-disabled");
    tryNowButton.classList.remove("bg-orange");
    tryNowButton.disabled = true;
  } else {
    tryNowButton.classList.add("bg-orange");
    tryNowButton.classList.remove("bg-disabled");
    tryNowButton.disabled = false;
  }
}

/**
 * Adds the animation to the element
 *
 * @param {Element} element The element to be animated
 * @param {String} className The animation class name
 */
function animateElement(element, className) {
  if (element.classList.contains(className)) return;

  if (
    document.documentElement.scrollTop +
      document.documentElement.clientHeight -
      50 >
    element.offsetTop
  ) {
    element.classList.remove("opacity-0");
    element.classList.add(className);
    element.classList.add("animate-once");
    element.classList.add("animate-duration-[1000ms]");
  }
}

/**
 * Animate page on scroll
 */
function animate() {
  const fadeUp = document.querySelectorAll(".fade-up");

  fadeUp?.forEach((element) => {
    animateElement(element, "animate-fade-up");
  });

  const fadeLeft = document.querySelectorAll(".fade-left");

  fadeLeft?.forEach((element) => {
    animateElement(element, "animate-fade-left");
  });

  const fadeRight = document.querySelectorAll(".fade-right");

  fadeRight?.forEach((element) => {
    animateElement(element, "animate-fade-right");
  });
}

window.addEventListener("load", function () {
  const tryNowButton = document.getElementById("try-btn");
  const linkedInSampleUrlInput = document.getElementById("linkedin-sample-url");
  const destination = document.getElementById("typedtext");

  animate();

  linkedInSampleUrlInput.addEventListener("input", (event) => {
    toggleTryNowButton(tryNowButton, event);
  });

  awaitTyping(
    "Enter a valid LinkedIn profile URL on the left, submit, and enjoy your personalised email!",
    destination,
    true,
    20,
  );

  webSocket.onopen = () => {
    // TODO Add error handling
    console.log("Established websocket connection");
  };

  webSocket.onerror = (error) => {
    // TODO Handle the error (although very unlikely we get one...)
  };

  webSocket.onclose = () => {
    console.log("Terminated websocket connection");
    awaitTyping(
      "You've been idle for too long and the connection has been terminated. Please refresh the web page.",
      destination,
      true,
      20,
    );
  };

  webSocket.onmessage = (message) => {
    var data = JSON.parse(message?.data)?.data;

    const handle = new Promise((resolve) => {
      if (data?.type === "error") {
        throw Error(data.errorMessage);
      }
      if (data?.positionIndex === 0) {
        cancelTyping = true;
        destination.innerHTML = "";
        tryNowButton.classList.add("bg-disabled");
        tryNowButton.classList.remove("bg-orange");
        tryNowButton.disabled = true;
      }

      if (data?.type === "end") {
        tryNowButton.classList.add("bg-orange");
        tryNowButton.classList.remove("bg-disabled");
        tryNowButton.disabled = false;
        resolve();
      }

      if (data?.type === "token")
        awaitTyping(data.generatedToken, destination, true, 10);

      resolve();
    });

    handle.catch((err) => {
      console.log(err);
      cancelTyping = true;
      destination.innerHTML = "";
      defaultErrorMessage = `Looks like we encountered an error processing "${linkedinEntryField?.value.trim()}", please check its value and try again! The error message is shown below:`;
      awaitTyping(defaultErrorMessage, destination, true, 20);
      if (err.message) awaitTyping("\n\n" + err.message, destination, true, 20);
    });
  };

  const tryButton = document.getElementById("try-btn");
  const linkedinEntryField = document.getElementById("linkedin-sample-url");

  tryButton.addEventListener("click", () => {
    var linkedinSampleUrl = linkedinEntryField?.value.trim();

    if (!linkedinRegex.test(linkedinSampleUrl)) {
      throw SyntaxError(
        `The provided LinkedIn URL, "${linkedinSampleUrl}", is not a valid URL!`,
      );
    }

    linkedinSampleUrl = linkedinSampleUrl.match(linkedinRegex)[0];
    destination.textContent = "";

    var payload = {
      action: "generatechat",
      profile_url: linkedinSampleUrl,
    };

    webSocket.send(JSON.stringify(payload));

    destination.innerHTML = "";
    cancelTyping = true;

    awaitTyping("Booting the superintelligent AI...", destination, true, 40);

    console.log(`Sent payload to websocket: "${JSON.stringify(payload)}"`);
  });

  const header = document.getElementById("header");
  if (
    document.documentElement.scrollTop > 10 &&
    !header.classList.contains("shadow-lg")
  ) {
    header.classList.add(
      "shadow-lg",
      "dark:shadow-shadow-light",
      "bg-white",
      "dark:bg-dark",
    );
  }

  document.addEventListener("scroll", (e) => {
    if (
      document.documentElement.scrollTop > 10 &&
      !header.classList.contains("shadow-lg")
    ) {
      header.classList.add(
        "shadow-lg",
        "dark:shadow-shadow-light",
        "bg-white",
        "dark:bg-dark",
      );
    }

    if (document.documentElement.scrollTop < 10) {
      header.classList.remove(
        "shadow-lg",
        "dark:shadow-shadow-light",
        "bg-white",
        "dark:bg-dark",
      );
    }

    const links = document.querySelectorAll("a.nav__link");
    links?.forEach((item) => {
      const [, id] = item.href.split("#");
      const section = document.getElementById(id);
      if (
        document.documentElement.scrollTop +
          document.documentElement.clientHeight / 2 >
        section.offsetTop
      ) {
        links.forEach((link) => {
          link.classList.remove("text-blue");
        });

        item.classList.add("text-blue");
      }
    });

    animate();
  });

  const tilesList = document.getElementsByClassName("tiles");
  for (const tiles of tilesList) {
    tiles.onmousemove = (e) => {
      for (const tile of tiles.getElementsByClassName("tile")) {
        const rect = tile.getBoundingClientRect(),
          x = e.clientX - rect.left,
          y = e.clientY - rect.top;

        tile.style.setProperty("--mouse-x", `${x}px`);
        tile.style.setProperty("--mouse-y", `${y}px`);
      }
    };
  }

  const pricingSwitchButtons = document.querySelectorAll(".pricing__switch");

  pricingSwitchButtons?.forEach((button) => {
    button?.addEventListener("click", (e) => {
      const label = document.getElementById("pricing__switch");

      label.classList.toggle("left-2");
      label.classList.toggle("left-[49%]");
      label.textContent = e.target.textContent;

      const periodLabels = document.getElementsByClassName("pricing__period");
      for (const periodLabel of periodLabels) {
        periodLabel.textContent = `/\ ${e.target.textContent}`;
      }

      const prices = document.getElementsByClassName("pricing__price");
      for (const price of prices) {
        const currentPrice = price.getAttribute("data-price");
        price.textContent =
          e.target.textContent.trim() === "Yearly"
            ? (parseFloat(currentPrice) * 10).toFixed(2).replace(/0$/, 9)
            : currentPrice;
      }
    });
  });

  if (
    localStorage.theme === "dark" ||
    (!("theme" in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  const themeSwitch = document.getElementById("theme-switch");
  themeSwitch.addEventListener("click", () => {
    if (document.documentElement.classList.contains("dark")) {
      localStorage.removeItem("theme");
    } else {
      localStorage.setItem("theme", "dark");
    }

    document.documentElement.classList.toggle("dark");
  });

  const hamburger = document.getElementById("hamburger");
  const menu = document.getElementById("menu");

  hamburger.addEventListener("click", () => {
    menu.classList.toggle("h-0");
    menu.classList.toggle("h-[12rem]");
    const line1 = document.getElementById("line-1");
    line1.classList.toggle("absolute");
    line1.classList.toggle("top-[50%]");
    line1.classList.toggle("left-[50%]");
    line1.classList.toggle("translate-x-[-50%]");
    line1.classList.toggle("translate-y-[-50%]");
    line1.classList.toggle("rotate-45");
    const line2 = document.getElementById("line-2");
    line2.classList.toggle("opacity-0");
    line2.classList.toggle("mt-1.5");
    const line3 = document.getElementById("line-3");
    line3.classList.toggle("absolute");
    line3.classList.toggle("top-[50%]");
    line3.classList.toggle("left-[50%]");
    line3.classList.toggle("translate-x-[-50%]");
    line3.classList.toggle("translate-y-[-50%]");
    line3.classList.toggle("rotate-[-45deg]");
    line3.classList.toggle("mt-1.5");
  });
});
