'use strict';

const questionTypes = {
  text: 'Texto corto',
  textarea: 'Párrafo',
  email: 'Correo electrónico',
  number: 'Número',
  date: 'Fecha',
  single: 'Selección única',
  multiple: 'Selección múltiple'
};

function isChoice(type){
  return type === 'single' || type === 'multiple';
}

function labeled(label, control){
  const wrapper = text('label', label);
  wrapper.append(control);
  return wrapper;
}

function checkbox(checked = false){
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  return input;
}

function action(label, click){
  const button = text('button', label);
  button.type = 'button';
  button.className = 'secondary';
  button.onclick = click;
  return button;
}

function renderQuestions(container, questions){
  for(const question of questions){
    const name = 'question-' + question.id;
    const label = question.label + (question.required ? ' (obligatoria)' : '');
    if(isChoice(question.type)){
      const group = document.createElement('fieldset');
      group.append(text('legend',label));
      const multiple = question.type === 'multiple';
      group.append(text('small',multiple ? 'Puedes marcar varias opciones.' : 'Selecciona una opción.'));
      for(const option of question.options){
        const input = document.createElement('input');
        input.type = multiple ? 'checkbox' : 'radio';
        input.name = name;
        input.value = option.id;
        input.required = multiple ? option.required : question.required;
        group.append(labeled(option.label + (multiple && option.required ? ' (obligatoria)' : ''),input));
      }
      if(!multiple && !question.required){
        group.append(action('Limpiar selección', () => {
          for(const input of group.querySelectorAll('input')) input.checked = false;
        }));
      }
      container.append(group);
      continue;
    }
    const input = document.createElement(question.type === 'textarea' ? 'textarea' : 'input');
    if(question.type !== 'textarea') input.type = question.type;
    if(question.type === 'number') input.step = 'any';
    input.name = name;
    input.required = question.required;
    input.maxLength = question.type === 'textarea' ? 2000 : 250;
    container.append(labeled(label,input));
  }
}

function readAnswers(questions, fields){
  const answers = [];
  for(const question of questions){
    const entries = fields.getAll('question-' + question.id);
    let value;
    if(isChoice(question.type)){
      const options = question.options.filter(option => entries.includes(option.id));
      const multiple = question.type === 'multiple';
      if(multiple && question.options.some(option => option.required && !entries.includes(option.id))){
        return {error:'Marca las opciones obligatorias de «'+question.label+'».'};
      }
      value = multiple ? options.map(option => option.label) : options[0]?.label;
    }else{
      value = entries[0]?.trim();
    }
    if(!value?.length){
      if(question.required) return {error:'Completa la pregunta «'+question.label+'».'};
      continue;
    }
    answers.push({questionId:question.id,label:question.label,value});
  }
  return {answers};
}

function addQuestion(question){
  const card = document.createElement('fieldset');
  card.className = 'question-card';
  card.append(text('legend','Pregunta'));
  const label = document.createElement('input');
  label.className = 'question-label';
  label.value = question.label;
  label.required = true;
  label.maxLength = 150;
  const type = document.createElement('select');
  type.className = 'question-type';
  for(const [key, name] of Object.entries(questionTypes)){
    const option = text('option',name);
    option.value = key;
    type.append(option);
  }
  type.value = question.type;
  const required = checkbox(question.required);
  required.className = 'question-required';
  const choices = document.createElement('div');
  const options = document.createElement('div');

  function addOption(option, focus = false){
    const row = document.createElement('div');
    row.className = 'option-row';
    row.dataset.optionId = option.id;
    const label = document.createElement('input');
    label.className = 'option-label';
    label.maxLength = 100;
    label.value = option.label;
    label.required = isChoice(type.value);
    const required = checkbox(option.required);
    required.className = 'option-required';
    const requiredLabel = labeled('Opción obligatoria',required);
    requiredLabel.hidden = type.value !== 'multiple';
    row.append(labeled('Texto de la opción',label),requiredLabel,action('Quitar opción',()=>row.remove()));
    options.append(row);
    if(focus) label.focus();
  }

  function updateType(){
    choices.hidden = !isChoice(type.value);
    if(!choices.hidden && !options.children.length){
      for(let index = 0; index < 2; index++) addOption({id:id(),label:''});
    }
    for(const row of options.children){
      row.querySelector('.option-label').required = !choices.hidden;
      row.querySelector('.option-required').parentElement.hidden = type.value !== 'multiple';
    }
  }

  choices.append(
    text('p','Agrega al menos dos opciones. En selección múltiple puedes exigir opciones concretas.'),
    options,
    action('＋ Agregar opción',()=>addOption({id:id(),label:''},true))
  );
  card.dataset.questionId = question.id;
  card.append(labeled('Texto de la pregunta',label),labeled('Tipo de respuesta',type),
    labeled('Pregunta obligatoria',required),choices,action('Quitar pregunta',()=>card.remove()));
  for(const option of question.options ?? []) addOption(option);
  type.onchange = updateType;
  updateType();
  $('#questions').append(card);
  return label;
}

function openSchemaEditor(event){
  const dialog = $('#form-editor');
  const form = $('#schema-form');
  const report = message => { $('#schema-error').textContent = message; };
  $('#form-title').textContent = 'Formulario de «'+event.title+'»';
  $('#questions').replaceChildren();
  report('');
  for(const question of event.questions ?? []) addQuestion(question);
  $('#add-question').onclick = () => addQuestion({id:id(),label:'',type:'text'}).focus();
  $('#cancel-schema').onclick = () => dialog.close();
  form.onsubmit = submitEvent => {
    submitEvent.preventDefault();
    report('');
    const questions = [];
    for(const card of $('#questions').children){
      const labelInput = card.querySelector('.question-label');
      const label = labelInput.value.trim();
      if(!label){ report('Escribe el texto de cada pregunta.'); labelInput.focus(); return; }
      const type = card.querySelector('.question-type').value;
      const required = card.querySelector('.question-required').checked;
      const options = isChoice(type) ? [...card.querySelectorAll('.option-row')].map(row => ({
        id:row.dataset.optionId,
        label:row.querySelector('.option-label').value.trim(),
        required:type === 'multiple' && row.querySelector('.option-required').checked
      })) : [];
      if(isChoice(type) && (options.length < 2 || options.some(option => !option.label) ||
          new Set(options.map(option => option.label.toLocaleLowerCase('es-MX'))).size !== options.length)){
        report('Agrega al menos dos opciones distintas y sin espacios vacíos en «'+label+'».');
        card.querySelector('.question-type').focus();
        return;
      }
      questions.push({id:card.dataset.questionId,label,type,required,options});
    }
    if(persist(events.map(item => item.id === event.id ? {...item,questions} : item),report)){
      dialog.close();
      render();
      $('.edit-schema').focus();
      notice('Formulario guardado para '+event.title+'.');
    }
  };
  dialog.showModal();
}
