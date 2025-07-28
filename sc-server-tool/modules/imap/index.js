const Imap = require("imap");
const { simpleParser } = require("mailparser");

const MAX_EMAIL_NUMBER = 50;

/**
 * Function to retrieve emails from an IMAP server
 * @param {Object} options - The options for connecting to the IMAP server
 * @param {string} options.email - The email address to login
 * @param {string} options.password - The password for the email account
 * @param {string} options.sender_filter - The email address of the desired sender
 * @returns {Promise<Array>} - A promise that resolves to an array of email objects
 */
const getEmails = (options) => {
  try {
    return new Promise((res, rej) => {
      const SENDER_FILTER = options.sender_filter;
      console.log("SENDER_FILTER", SENDER_FILTER);

      const imapConfig = {
        user: "pytelbigdas@hotmail.com",
        password: "6JJG7R61",
        host: "outlook.office365.com",
        port: 993,
        tls: true,
      };

      let emails_list = [];
      const imap = new Imap(imapConfig);
      imap.once("ready", () => {
        imap.openBox("INBOX", false, () => {
          let date = new Date(Date.now() - 86400000);
          imap.search(["ALL", ["SINCE", date]], (err, results) => {
            if (results && results.length) {
              const f = imap.fetch(results, { bodies: "" });
              f.on("message", (msg) => {
                msg.on("body", (stream) => {
                  simpleParser(stream, async (err, parsed) => {
                    if (err) {
                      console.error("Parse error:", err);
                      return;
                    }
                    console.log(parsed);

                    const { from, subject, textAsHtml, text, date } = parsed;
                    if (
                      from?.value?.[0]?.address === SENDER_FILTER &&
                      emails_list.length < MAX_EMAIL_NUMBER
                    ) {
                      let data = {
                        from: from.value[0].address,
                        subject,
                        text,
                        date,
                      };
                      emails_list.push(data);
                    }
                  });
                });
              });

              f.once("error", (ex) => {
                return Promise.reject(ex);
              });

              f.once("end", () => {
                imap.end();
              });
            } else {
              res([]);
            }
          });
        });
      });

      imap.once("error", (err) => {
        console.log(1, err);
        console.error("IMAP error:", err);
        rej(err); // reject luôn để Promise trả về lỗi
      });

      imap.once("end", () => {
        res(emails_list);
        // RETURN emails_list HERE
      });

      imap.connect();
    });
  } catch (ex) {
    console.log(2, ex);
  }
};
/**
 * Function to wait for a specified number of milliseconds
 * @param {number} ms - The number of milliseconds to wait
 * @returns {Promise} - A promise that resolves after the specified time
 */
function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(function () {
      resolve("ok");
    }, ms)
  );
}

module.exports = {
  getEmails: getEmails,
  /**
   * Function to retrieve verification codes from emails
   * @param {Object} options - The options for connecting to the IMAP server
   * @param {string} options.email - The email address to login
   * @param {string} options.password - The password for the email account
   * @param {string} [sender_filter='noreply@google.com'] - The email address of the desired sender
   * @returns {Promise<string>} - A promise that resolves to a comma-separated string of verification codes
   */
  async getVeiryCode(options, sender_filter = "noreply@google.com") {
    let retry = 0;
    let emails = [];
    do {
      await sleep(5000);
      emails = await this.getEmails({
        sender_filter,
        email: options.email,
        password: options.password,
      });
      retry++;
    } while (retry <= 3 && !emails.length);

    let codes = [];
    console.log("emails", emails);
    emails.forEach((emailData) => {
      try {
        if (sender_filter == "noreply@google.com") {
          let code = emailData.subject.split(":")[1];
          if (code && Number(code)) {
            codes.push(code);
          }
        } else {
          // fb
          let codeData = emailData.text.split(" ");
          codeData.forEach((word) => {
            if (Number(word) && Number(word) > 9000000) {
              codes.push(word);
            }
          });
        }
      } catch (error) {}
    });
    codes.reverse();
    return codes.join(",");
  },
};
