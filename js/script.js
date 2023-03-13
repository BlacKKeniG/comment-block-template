'use strict'
//date
class DateTime {
    getYesterdayDate() {
        let currentDate = new Date();
        return `${currentDate.getFullYear()}-${getZeroIfNeed(currentDate.getMonth() + 1)}-${getZeroIfNeed(currentDate.getDate() - 1)}`;
    }
    getCurrentDate() {
        let currentDate = new Date();
        return `${currentDate.getFullYear()}-${getZeroIfNeed(currentDate.getMonth() + 1)}-${getZeroIfNeed(currentDate.getDate())}`;
    }
    getCurrentTime() {
        let currentDate = new Date();
        return `${currentDate.getHours()}:${getZeroIfNeed(currentDate.getMinutes())}`
    }
    getValidCommentData(date){
        let currentDateTime = new DateTime();
        
        return (currentDateTime.getCurrentDate() == date) ? "Сегодня" 
            : (currentDateTime.getYesterdayDate() == date) ? "Вчера" 
            : date;
    };
}

//comments
getCommentsfromDb('db.json')
.then(comments => {
    comments.forEach(({userName, date, text, isLiked, time}) => {
        new Comment( userName, date, text, isLiked, time)
        .create(".comment-block__comments");
    });
}).then(() =>{
    setNumberAndWordCommentAtCorrectCaseTo(".comment-block__num-of-comments", ".comment");
});

class Comment{
    constructor(userName, date, text, isLiked = "false", time){
        this.userName = userName;
        this.date = date;
        this.text = text;
        this.time = time;
        this.isLiked = isLiked;
    }
    create(parent) {

        let commentLikeClass = "comment__like";
        if(this.isLiked == "true"){
            commentLikeClass += " comment__liked";
        }
        if(!this.time){
            this.time = new DateTime().getCurrentTime();
        }
    
        document.querySelector(parent).insertAdjacentHTML('afterbegin', 
            `<article class="comment" data-is-liked="${this.isLiked}">
                <div class="comment__header">
                    <h3 class="comment__header__name">${this.userName}</h3>
                    <span class="comment__header__date-time">${new DateTime().getValidCommentData(this.date)}, ${this.time}</span>
                </div>
                <div class="comment__triggers">
                    <div class="comment__trigger">
                        <svg class="${commentLikeClass}" viewBox="0 0 55.000000 50.000000">
                            <g class="comment__like" transform="translate(0.000000,50.000000) scale(0.100000,-0.100000)">
                                <path class="comment__like" d="M100 432 c-68 -34 -93 -128 -51 -196 27 -43 117 -127 176 -165 l48
                                -31 40 23 c52 29 160 129 187 172 52 85 8 192 -88 211 -42 8 -74 -1 -110 -31
                                -27 -23 -31 -23 -43 -8 -17 20 -71 43 -101 43 -13 0 -39 -8 -58 -18z"/>
                            </g>
                        </svg>
                    </div>
                    <div class="comment__trigger">
                        <img class="comment__delete" src="img/icons/delete.svg" alt="delete">
                    </div>
                </div>
                <div class="comment__body">${this.text}</div>
                <div class="line-delimiter line-delimiter_comment-grid-area"></div>
            </article>`);
    }
}

async function getCommentsfromDb(url){
    const response = await fetch(url);
    if(!response.ok) {
        throw new Error(`Could not fetch ${url}, status: ${response.status}`);
    }
    return await response.json();
} 

function toggleLikeComment(event) {
    let comment = event.closest('article');
    let like = event.closest('svg');

    comment.dataset.isLiked = (comment.dataset.isLiked == "false") ? "true" : "false";
    like.classList.toggle("comment__liked");
}

//comments-block
commentsBlockAddListenerToggleLikeComment();
commentsBlockAddListenerDeleteComment();

function commentsBlockAddListenerToggleLikeComment(){
    document.querySelector(".comment-block__comments")
        .addEventListener('click', event => {
        if(event.target.classList.contains("comment__like")){
            toggleLikeComment(event.target);
        }
    });
}

function commentsBlockAddListenerDeleteComment(){
    document.querySelector(".comment-block__comments")
        .addEventListener('click', event => {
        if(event.target.classList.contains("comment__delete")){
            let comment = event.target.closest('article');
            if(comment){
                comment.remove();
                setNumberAndWordCommentAtCorrectCaseTo(".comment-block__num-of-comments", ".comment");
            }
        }
    });
}

function setWordCommentAtCorrectCase(numOfComments) {
    let word = "Комментарий";
        const lowestDiget = numOfComments % 10;
        const secondDiget = (numOfComments / 10) % 10;
        
        if (lowestDiget > 1 && lowestDiget < 5 && secondDiget != 1) {
            word = word.substring(0, word.length-1) + "я";
        }
        else if(lowestDiget != 1 || secondDiget == 1) {
            word =  word.substring(0, word.length-1) + "ев";
        }
	return word;
}

function setNumberAndWordCommentAtCorrectCaseTo(fildSelector, commentSelector) {
    let fild = document.querySelector(fildSelector);
    let numOfComments = countNumberOfElements(commentSelector);
    fild.textContent = `${numOfComments} ${setWordCommentAtCorrectCase(numOfComments)}`;
}

function createErrorMessage(text, ...cssAtattributes){
    let errorMessage = document.createElement('p');
    errorMessage.textContent = text;
    errorMessage.classList.add('error-text', ...cssAtattributes);
    return errorMessage;
}

//form
commentFormValidation();

function commentFormValidation(){
    const form = document.querySelector('#comment-form');
    const divTextArea = form.querySelector('.comment__form__textarea');
    const defaultTextAtArea = "Оставьте комментарий...";
    let isNameValid = false;
    let isDateValid = false;
    let isTextValid = false;

    form.date.value = new DateTime().getCurrentDate();

    divTextAreaValidation(divTextArea, defaultTextAtArea);
    
    form.oninput = event => {   
        switch(event.target) {

            case form.username: {
                isNameValid = monitorNameInput(form);
                break;
            }
            case form.date: {
                isDateValid = monitorDateInput(form);
                break;
            }
            case divTextArea:{
                isTextValid = monitorTextInput(divTextArea, defaultTextAtArea);
                break;
            }
        }
    }

    form.onsubmit = event => submit(event);

    form.addEventListener('keydown', event => {
        if((event.target === form.username || event.target === form.date)
             && event.code === 'Enter'){
            submit(event);
        }
    });
        
    function submit(event){
        event.preventDefault()

        let isAllOk = checkingOfInputData(form, divTextArea, defaultTextAtArea);
        if(!isAllOk) { //hello dancing with a tambourine

            if(divTextArea.textContent == defaultTextAtArea){
                divTextArea.onclick = event => event.target.textContent = "";
            }
            return false;
        }
        
        new Comment(
            form.username.value
            , form.date.value
            , divTextArea.innerHTML
            ).create(".comment-block__comments"
        );
        setNumberAndWordCommentAtCorrectCaseTo(".comment-block__num-of-comments", ".comment");

        cleareFormData(form, divTextArea, defaultTextAtArea);
    }
}

function cleareFormData(form, divTextArea, defaultTextAtArea) {
    form.username.value = "";
    form.date.value = new DateTime().getCurrentDate();
    divTextArea.textContent = defaultTextAtArea;
    divTextArea.onclick = event => event.target.textContent = "";
}

function checkingOfInputData(form, divTextArea, defaultTextAtArea) {
    return monitorNameInput(form) 
        && monitorDateInput(form) 
        && monitorTextInput(divTextArea, defaultTextAtArea); 
}

function monitorNameInput(form) {
    const minUserNameLength = 2;
    const maxUserNameLength = 30;
    let userName = form.username.value;

    let errorMessage = form.querySelector('.error-name');
    if(errorMessage){
        form.username.style.border = "1px solid black";
        errorMessage.remove();
    }
        
    if(!userName) {
        form.username.style.border = "1px solid red";
        form.username.after(createErrorMessage(
            `Поле обязательно к заполнению!`,
             'error-name',
        ));
        return false;    
    }
    if(userName.length < minUserNameLength) {
        form.username.style.border = "1px solid red";
        form.username.after(createErrorMessage(
            `Минимальная длина имени ${minUserNameLength} символа!`,
            'error-name',
        ));
        return false;
    }
    if(userName.length > maxUserNameLength){
        form.username.style.border = "1px solid red";
        form.username.after(createErrorMessage(
            `Максимальная длина имени ${maxUserNameLength} символов`, 
             'error-name',
        ));
        return false;
    }
    return true;
}

function monitorDateInput(form) {
    const minDate = "1970-01-01"
    let userDate = form.date.value;

    let errorMessage = form.querySelector('.error-date');
    if(errorMessage){
        form.date.style.border = "1px solid black";
        errorMessage.remove();
    }

    if(userDate < minDate){
        form.date.style.border = "1px solid red";
        form.date.after(createErrorMessage(
            `минимально допустимая дата ${minDate}!`,
            'error-date',
        ));
        return false;
    }
    if(userDate > new DateTime().getCurrentDate()){
        form.date.style.border = "1px solid red";
        form.date.after(createErrorMessage(
            `Дата не может быть болше текушей!`,
            'error-date',
        ));
        return false;
    }
    return true;
}

function monitorTextInput(divTextArea, defaultTextAtArea) {
    let errorMessage = document.querySelector('.error-textArea');
    divTextArea.onclick = null;

    if(errorMessage){
        divTextArea.style.border = "1px solid black";
        errorMessage.remove();
    }
    
    if(divTextArea.textContent == "" || divTextArea.textContent == defaultTextAtArea) {
        divTextArea.style.border = "1px solid red";
        divTextArea.after(createErrorMessage(
            "Пустой комментарий не будет отправлен!",
            'error-textArea',
        ));
        return false;
    }
    return true;
}

function divTextAreaValidation(divTextArea, defaultTextAtArea){
    const commentBlock = document.querySelector(".comment-block");

    //divTextArea.contentEditable = true; //set at index.html
    divTextArea.textContent = defaultTextAtArea;

    divTextArea.onclick = event => event.target.textContent = "";
    
    divTextArea.onfocus = event => {
        event.target.style.maxWidth = "inherit";
        event.target.style.width = `${commentBlock.clientWidth - 20}px`; //минус левый и правый падинги блока комментариев //будет время надо убрать могическое число 
        event.target.style.minHeight = "250px";
    }
    
    divTextArea.onblur = event => {
        event.target.style.maxWidth = "550px";
        event.target.style.width = "inherit";
        event.target.style.minHeight = "100px";
    }
}

/////
function countNumberOfElements(elemSelector){
    return document.querySelectorAll(elemSelector).length;
}

function getZeroIfNeed(num){
    return (num < 10) ? `0${num}` : num;
}