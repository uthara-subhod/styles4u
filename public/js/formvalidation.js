let form=document.querySelector('#form1');

const email= document.querySelector('#email');
const username=document.querySelector('#username');
const password=document.querySelector('#password');
const confirm=document.querySelector('#re-password');
const emailRegex =  /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
form.addEventListener('submit', function (e) {
  let error=false
    // prevent the form from submitting
    e.preventDefault();
    if(email){
        if (!emailRegex.test(email.value)) {
            document.getElementById("email_error").style.display="block"
            error=true
          }
          else{
            document.getElementById("email_error").style.display="none"
          }
    }
  
  if(!usernameRegex.test(username.value)){
    document.getElementById("username_error").style.display="block"
    error=true
  }
  else{
    document.getElementById("username_error").style.display="none"
  }
  if(!passwordRegex.test(password.value)){
    document.getElementById("password_error").style.display="block"
    error=true
  }else{
    document.getElementById("password_error").style.display="none"
    if(confirm){
        if(password.value!=confirm.value){
            document.getElementById("re_password_error").style.display="block"
            error=true
          }
          else{
            document.getElementById("re_password_error").style.display="none"
          }
    }
  }
  if(email){
    if(emailRegex.test(email.value)&&usernameRegex.test(username.value)&&passwordRegex.test(password.value)&&(password.value==confirm.value)){
      error=false
    }
  }
  else{
    if(usernameRegex.test(username.value)&&passwordRegex.test(password.value)){
      error=false
    }
  }

    if(!error){
      form.submit()
    }

  });
