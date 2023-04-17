$(document).ready(function () {
    const animationDuration = 500;
  
    function showError(element) {
      element.addClass("error");
      setTimeout(() => element.removeClass("error"), 1000);
    }

    let updateDiagnosisTimeout;
    let stepIndex = 0;
    updateQuestionCounter(0);
  
    $(document).on("click", ".next-step", function () {
      const currentStep = $(this).closest(".step");
      const nextStep = currentStep.next(".step");
  
      const inputValue = currentStep.find("input").val();
      if (!inputValue && currentStep.find("input").attr("required")) {
        showError(currentStep.find("input"));
        return;
      } else {
        updateQuestionCounter(0);
      }

  
      currentStep.animate(
        {
          marginLeft: "-100%",
          opacity: 0,
        },
        animationDuration,
        function () {
          currentStep.hide().css("marginLeft", "0");
        }
      );
  
      nextStep.css({
          marginLeft: "100%",
          display: "block",
        })
        .animate(
          {
            marginLeft: "0",
            opacity: 1,
          },
          animationDuration
        );
        startEllipsisAnimation();
  clearTimeout(updateDiagnosisTimeout);
  updateDiagnosisTimeout = setTimeout(updateSuspectedDiagnosis, 1000);
    });
  
    $(document).on("click", ".prev-step", function () {
      const currentStep = $(this).closest(".step");
      const prevStep = currentStep.prev(".step");
  
      currentStep.animate(
        {
          marginLeft: "100%",
          opacity: 0,
        },
        animationDuration,
        function () {
          currentStep.hide().css("marginLeft", "0");
        }
      );
  
      prevStep.css({
          marginLeft: "-100%",
          display: "block",
        })
        .animate(
          {
            marginLeft: "0",
            opacity: 1,
          },
          animationDuration
        );
        updateQuestionCounter(1);
    });

    function updateQuestionCounter(param) {
        const totalQuestions = $(".step").length - 1;
        if (param === 0 && stepIndex < totalQuestions) {
          stepIndex++;
        } else if (param !== 0 && stepIndex > 0) {
          stepIndex--;
        }
        $(".question-counter").text(`${stepIndex}/${totalQuestions + 1}`);
      }      

      async function updateSuspectedDiagnosis() {
        const formData = $('form').serializeArray();
        const data = {};
        formData.forEach((item) => {
          data[item.name] = item.value;
        });
      
        try {
          const response = await $.post('/get_diagnosis', data);
          stopEllipsisAnimation();
          if (response && response.diagnosis) {
            let suspectedText = response.diagnosis;

            if (response.comments && response.comments.length > 0) {
              suspectedText = "<strong>" + suspectedText + "</strong>" + "<br><br>" + '"' + response.comments + '"' + " 🤓";
            }
            
        //     if (response.treatment && response.treatment.length > 0) {
        //         suspectedText += "\n " +  response.treatment;
        //       }

        // if (response && response.gpt3Response) {
        //     let suspectedText = response.gpt3Response;
      
            $("#suspected-diagnosis").html(suspectedText);
          } else {
            $("#suspected-diagnosis").text("Unknown");
          }
        } catch (error) {
          console.error("Error updating diagnosis:", error);
        }
      }




      $(document).on("click", ".next-button", async function () {
            const formDataArray = $("form").serializeArray();
            const data = {};
            const followUpQuestions = [];
            const followUpAnswers = [];
            
            formDataArray.forEach((item) => {
              data[item.name] = item.value;
          
              if (item.name.startsWith("question-")) {
                followUpQuestions.push(item.name);
                followUpAnswers.push(item.value);
              }
            });
          
            data.follow_up_questions = followUpQuestions;
            data.follow_up_answers = followUpAnswers;
          
            try {
              const response = await $.post("/follow-up", data);
              if (response) {
                const followUpQuestion = response.trim();
                addFollowUpQuestion(followUpQuestion);
              }
            } catch (error) {
              console.error("Error adding follow-up question:", error);
            }
          });
          
      
          function addFollowUpQuestion(question) {
            const totalQuestions = $(".step").length - 1;
            const questionNumber = totalQuestions + 1;
          
            const newStep = `
              <div id="step-${questionNumber}" class="step">
                <label for="question-${questionNumber}">${question}</label>
                <input type="hidden" name="follow_up_questions[]" value="${question}">
                <input type="text" id="question-${questionNumber}" name="follow_up_answers[]">
                <div class="step-controls">
                    <button type="button" class="prev-step">Previous</button>
                    ${questionNumber > 10 ? '<button type="submit" class="submit-button">Submit</button>' : ''}
                    <button type="button" class="next-step next-button">Next</button>
                 </div>
                 <div class="question-counter"></div>
              </div>
            `;
          
            $(newStep).insertBefore(".diagnosis-section");
          
            updateQuestionCounter(0);
          }
          
      
      
      
      

      
      $("input").on("change", function () {
        clearTimeout(updateDiagnosisTimeout);
        updateDiagnosisTimeout = setTimeout(updateSuspectedDiagnosis, 1000);
      });
      
      function startEllipsisAnimation() {
        $(".ellipsis").css("display", "inline-block");
      }

      function stopEllipsisAnimation() {
        $(".ellipsis").css("display", "none");
      }

      $("#symptom-checker-form").on("submit", function () {
        $("#submit-step").hide();
        $(".loader").show();
      });
    });
    



// $(".next-step").click(async function () {
//   const currentStep = $(this).parent();
//   const responseInput = currentStep.find("input");

//   if (responseInput.val().trim() === "") {
//     showError(responseInput);
//     return;
//   }

//   const followUpQuestion = await getFollowUpQuestion(responseInput.val().trim());

//   if (followUpQuestion) {
//     const followUpStep = createFollowUpStep(followUpQuestion);
//     followUpStep.insertAfter(currentStep);
//   }

//   currentStep.hide();
//   currentStep.next().show();
// });

// async function getFollowUpQuestion(userResponse) {
//   const response = await fetch("/follow-up", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ userResponse }),
//   });

//   const followUpQuestion = await response.text();
//   return followUpQuestion;
// }

// function createFollowUpStep(questionText) {
//   const followUpStep = $(`
//     <div class="step follow-up-step">
//       <label>${questionText}</label>
//       <input type="text" name="follow_up_response" required>
//       <button type="button" class="next-step">Next</button>
//       <button type="button" class="prev-step">Previous</button>
//       <div class="question-counter"></div>
//     </div>
//   `);

//   followUpStep.find(".next-step").click(async function () {
//     const currentStep = $(this).parent();
//     const responseInput = currentStep.find("input");

//     if (responseInput.val().trim() === "") {
//       showError(responseInput);
//       return;
//     }

//     const followUpQuestion = await getFollowUpQuestion(responseInput.val().trim());

//     if (followUpQuestion) {
//       const followUpStep = createFollowUpStep(followUpQuestion);
//       followUpStep.insertAfter(currentStep);
//     }

//     currentStep.hide();
//     currentStep.next().show();
//   });

//   followUpStep.find(".prev-step").click(function () {
//     const currentStep = $(this).parent();
//     currentStep.hide();
//     currentStep.prev().show();
//   });

//   return followUpStep;
// }

  //TESTING CHATGPT API
  // import { config } from "dotenv"
// config()

// import { Configuration, OpenAIApi } from "openai"
// import readline from "readline"

// const openai = new OpenAIApi(
//   new Configuration({
//     apiKey: process.env.API_KEY,
//   })
// )

// const userInterface = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// })

// userInterface.prompt();
// userInterface.on("line", async input => {
//   const res = await openai
//   .createChatCompletion({
//     model: "gpt-3.5-turbo",
//     messages: [{ role:"user", content: input}],
//   })
//   console.log(res.data.choices[0].message.content)
//   userInterface.prompt()
// })
