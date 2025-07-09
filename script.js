const faults = [
    { id: 'F1', name: 'Heat recovery wheel (\\(HRW\\)) stuck', type: 'individual' },
    { id: 'F2', name: 'Supply fan (\\(Fan\\)) stuck', type: 'individual' },
    { id: 'F3', name: 'Heating coil valve (\\(U_{\\text{hc}}\\)) stuck', type: 'individual' },
    { id: 'F4', name: 'Supply air static pressure setpoint (\\(P_{\\text{sa,set}}\\)) wrong', type: 'individual' },
    { id: 'F5', name: 'Supply air temperature setpoint (\\(T_{\\text{sa,set}}\\)) wrong', type: 'individual' },
    { id: 'F6', name: 'Supply air temperature sensor (\\(T_{\\text{sa}}\\)) bias', type: 'sensor_bias_start' },
    { id: 'F7', name: 'Supply air static pressure sensor (\\(P_{\\text{sa}}\\)) bias', type: 'sensor_bias' },
    { id: 'F8', name: 'Pre-heating air temperature sensor (\\(T_{\\text{pre}}\\)) bias', type: 'sensor_bias' },
    { id: 'F9', name: 'Return air temperature sensor (\\(T_{\\text{ra}}\\)) bias', type: 'sensor_bias' },
    { id: 'F10', name: 'Supply heating coil water temperature sensor (\\(T_{\\text{sw}}\\)) bias', type: 'sensor_bias' },
    { id: 'F11', name: 'Supply air flow rate sensor (\\(F_{\\text{sa}}\\)) bias', type: 'sensor_bias' }
];

const symptoms = [
    { id: 'S1', name: 'Supply air temperature (\\(T_{\\text{sa}}\\)) is higher or lower than the setpoint (\\(T_{\\text{sa, set}}\\)) (larger than 0.5 °C)' },
    { id: 'S2', name: 'Supply air static pressure (\\(P_{\\text{sa}}\\)) is higher or lower than the setpoint (\\(P_{\\text{sa,set}}\\)) (larger than 5 Pa)' },
    { id: 'S3', name: 'Room air temperature (\\(T_{\\text{in,105}}\\)) is higher or lower than the setpoint (\\(T_{\\text{in,set}}\\)) (larger than 0.5 °C)' },
    { id: 'S4', name: 'Heating coil valve position (\\(U_{\\text{hc}}\\)) is too high or too low than the expected value. (large than 18%)' },
    { id: 'S5', name: 'Pre-heating air temperature (\\(T_{\\text{pre}}\\)) is too high (1 °C  larger than return temperature (\\(T_{\\text{ra}}\\)))' },
    { id: 'S6', name: 'Supply air temperature (\\(T_{\\text{sa}}\\)) is too high or too low than the expected value. ( larger than 1.19  °C)' },
    { id: 'S7', name: 'CO2 concentration in office room is too high. ( higher than 500 ppm)' },
    { id: 'S8', name: 'Heat recovery efficiency (\\(\\eta_{\\text{sa}}\\)) is too high. (higher than 90%)' },
    { id: 'S9', name: 'Supply air static pressure (\\(P_{\\text{sa}}\\)) is too high or too low than the expected value. (larger than 11.46 Pa)' },
    { id: 'S10', name: 'Heat recovery efficiency (\\(\\eta_{\\text{sa}}\\)) is too low (lower than 71%)' },
    { id: 'S11', name: 'Supply filter pressure drop is too low. (lower than 55 Pa)' },
    { id: 'S12', name: 'Difference between supply heat recovery efficiency (\\(\\eta_{\\text{sa}}\\)) and return heat recovery efficiency (\\(\\eta_{\\text{eha}}\\)) is large' },
    { id: 'S13', name: 'Supply air temperature sensor (\\(T_{\\text{sa}}\\)) reading differs from a nearby temperature sensor reading(Larger than 1 °C)' },
    { id: 'S14', name: 'Supply pressure setpoint (\\(P_{\\text{sa,set}}\\)) is too high (300 Pa) relative to the winter outdoor temperature' },
    { id: 'S15', name: 'Supply temperature setpoint (\\(T_{\\text{sa,set}}\\)) is too high (26) relative to winter outdoor temperature' },
    { id: 'S16', name: 'Flowrate sensor reading is too low while fan speed is normal' },
    { id: 'S17', name: 'Return air temperature sensor (\\(T_{\\text{ra}}\\)) reading differs from a nearby temperature sensor reading (larger than 1 °C)' },
    { id: 'S18', name: 'Supply fan pressure drop (\\(\\Delta P_{\\text{sf}}\\)) is too high or too low than the expected value. ( larger than 59.58 Pa)' },
    { id: 'S19', name: 'Supply fan control signal (\\(N_{\\text{sf}}\\)) is too high or too low than the expected value. (larger than 6.3 %)' }
];

const answers = {};
let currentFaultIndex = 0;

const faultContainer = document.getElementById('fault-container');
const form = document.querySelector('form');

const scriptURL = 'https://script.google.com/macros/s/AKfycbzTTvLQbl-Zdn6cLVHXTboSNBSDmzg4DP04LkDImMblkq5tsJzgna0X9jWgmFcf9wT8/exec';

function saveCurrentAnswers() {
    if (currentFaultIndex >= faults.length) {
        return;
    }
    const fault = faults[currentFaultIndex];
    const faultId = fault.id;
    
    if (fault.type === 'individual' || fault.type === 'sensor_bias_start') {
        const frequencyEl = document.querySelector('input[name="fault_frequency"]:checked');
        const frequencyConfidenceEl = document.querySelector('select[name="fault_frequency_confidence"]');
        const frequencyKey = fault.type === 'sensor_bias_start' ? 'sensor_bias' : faultId;
        if (!answers[frequencyKey]) answers[frequencyKey] = {};
        answers[frequencyKey].frequency = frequencyEl ? frequencyEl.value : '';
        answers[frequencyKey].frequencyConfidence = frequencyConfidenceEl ? frequencyConfidenceEl.value : '';
    }
    
    const selectedSymptoms = Array.from(document.querySelectorAll(`#symptom-selection input[type="checkbox"]:checked`)).map(cb => cb.value);
    const ratings = {};
    selectedSymptoms.forEach(symptomId => {
        const influenceEl = document.querySelector(`select[name="${faultId}_${symptomId}_influence"]`);
        const confidenceEl = document.querySelector(`select[name="${faultId}_${symptomId}_confidence"]`);
        ratings[symptomId] = {
            influence: influenceEl ? influenceEl.value : '',
            confidence: confidenceEl ? confidenceEl.value : ''
        };
    });

    if (!answers[faultId]) answers[faultId] = {};
    answers[faultId].selectedSymptoms = selectedSymptoms;
    answers[faultId].ratings = ratings;
}

function updateRatingTable() {
    const faultId = faults[currentFaultIndex].id;
    const selectedCheckboxes = document.querySelectorAll('#symptom-selection input[type="checkbox"]:checked');
    const tableBody = document.getElementById('rating-table-body');
    tableBody.innerHTML = '';
    const savedRatings = (answers[faultId] && answers[faultId].ratings) ? answers[faultId].ratings : {};

    selectedCheckboxes.forEach(checkbox => {
        const symptomId = checkbox.value;
        const symptom = symptoms.find(s => s.id === symptomId);
        const savedInfluence = (savedRatings[symptomId]) ? savedRatings[symptomId].influence : '';
        const savedConfidence = (savedRatings[symptomId]) ? savedRatings[symptomId].confidence : '';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><b>${symptom.id}</b>: ${symptom.name}</td>
            <td>
                <select name="${faultId}_${symptomId}_influence" required>
                    <option value="">-- Select --</option>
                    <option value="EH" ${savedInfluence === 'EH' ? 'selected' : ''}>Extremely High</option>
                    <option value="VH" ${savedInfluence === 'VH' ? 'selected' : ''}>Very High</option>
                    <option value="H" ${savedInfluence === 'H' ? 'selected' : ''}>High</option>
                    <option value="M" ${savedInfluence === 'M' ? 'selected' : ''}>Medium</option>
                    <option value="L" ${savedInfluence === 'L' ? 'selected' : ''}>Low</option>
                    <option value="VL" ${savedInfluence === 'VL' ? 'selected' : ''}>Very Low</option>
                    <option value="EL" ${savedInfluence === 'EL' ? 'selected' : ''}>Extremely Low</option>
                </select>
            </td>
            <td>
                <select name="${faultId}_${symptomId}_confidence" required>
                     <option value="">-- Select --</option>
                     <option value="High" ${savedConfidence === 'High' ? 'selected' : ''}>High Confidence</option>
                     <option value="Medium" ${savedConfidence === 'Medium' ? 'selected' : ''}>Medium Confidence</option>
                     <option value="Low" ${savedConfidence === 'Low' ? 'selected' : ''}>Low Confidence</option>
                </select>
            </td>
        `;
        tableBody.appendChild(row);
    });

    if (window.MathJax) {
        window.MathJax.typesetPromise();
    }
}

function displayCurrentFault() {
    const fault = faults[currentFaultIndex];
    const faultId = fault.id;
    let frequencyQuestionHTML = '';
    let savedFrequency = '';
    let savedFrequencyConfidence = '';

    if (fault.type === 'individual') {
        const savedData = answers[faultId] || {};
        savedFrequency = savedData.frequency || '';
        savedFrequencyConfidence = savedData.frequencyConfidence || '';
        frequencyQuestionHTML = generateFrequencyHTML(fault.name, savedFrequency, savedFrequencyConfidence);
    } else if (fault.type === 'sensor_bias_start') {
        const savedData = answers['sensor_bias'] || {};
        savedFrequency = savedData.frequency || '';
        savedFrequencyConfidence = savedData.frequencyConfidence || '';
        frequencyQuestionHTML = generateFrequencyHTML("a generic **Sensor Bias**", savedFrequency, savedFrequencyConfidence);
    }

    const savedSelections = (answers[faultId] && answers[faultId].selectedSymptoms) ? answers[faultId].selectedSymptoms : [];
    const symptomChecklistHTML = symptoms.map(s => {
        const isChecked = savedSelections.includes(s.id);
        return `
            <div>
                <input type="checkbox" id="${fault.id}_${s.id}" name="${fault.id}_symptoms" value="${s.id}" ${isChecked ? 'checked' : ''}>
                <label for="${fault.id}_${s.id}"><b>${s.id}</b>: ${s.name}</label>
            </div>
        `;
    }).join('');

    const prevButtonHTML = currentFaultIndex > 0 ? `<button type="button" id="prev-fault-btn">Previous Fault</button>` : `<div></div>`;
    const nextButtonText = currentFaultIndex === faults.length - 1 ? 'Finish' : 'Next Fault';
    const bottomProgressHTML = `<div class="bottom-progress">${currentFaultIndex + 1} / ${faults.length}</div>`;

    faultContainer.innerHTML = `
        <h3>
            <span><b>${fault.id}</b>: ${fault.name}</span>
            <span class="fault-progress">Fault ${currentFaultIndex + 1} of ${faults.length}</span>
        </h3>
        ${frequencyQuestionHTML}
        <h4>Step ${frequencyQuestionHTML ? '2' : '1'}: Symptom Selection</h4>
        <p>Please select all symptoms that could be caused by this fault.</p>
        <div id="symptom-selection">${symptomChecklistHTML}</div>
        <h4>Step ${frequencyQuestionHTML ? '3' : '2'}: Rate Selected Symptoms</h4>
        <p>For each symptom you selected, provide your rating.</p>
        <table id="rating-table">
            <thead><tr><th>Selected Symptom</th><th>Degree of Influence</th><th>Confidence</th></tr></thead>
            <tbody id="rating-table-body"></tbody>
        </table>
        <div class="button-container">${prevButtonHTML}${bottomProgressHTML}<button type="button" id="next-fault-btn">${nextButtonText}</button></div>
    `;

    document.getElementById('symptom-selection').addEventListener('change', () => {
        saveCurrentAnswers();
        updateRatingTable();
    });
    document.getElementById('next-fault-btn').addEventListener('click', goToNextFault);
    if (currentFaultIndex > 0) {
        document.getElementById('prev-fault-btn').addEventListener('click', goToPreviousFault);
    }
    updateRatingTable();
}

function generateFrequencyHTML(faultName, savedFrequency, savedFrequencyConfidence) {
    return `
        <div id="frequency-section">
            <h4>Step 1: Fault Frequency</h4>
            <div class="form-group">
                <label>Based on your experience, how often do you think ${faultName} happens?</label>
                <div class="frequency-option"><input type="radio" id="freq-vf" name="fault_frequency" value="very_frequent" ${savedFrequency === 'very_frequent' ? 'checked' : ''} required><label for="freq-vf">More than 10 times a year—very frequent</label></div>
                <div class="frequency-option"><input type="radio" id="freq-c" name="fault_frequency" value="common" ${savedFrequency === 'common' ? 'checked' : ''}><label for="freq-c">Every few months; a common, recurring problem</label></div>
                <div class="frequency-option"><input type="radio" id="freq-a" name="fault_frequency" value="annual" ${savedFrequency === 'annual' ? 'checked' : ''}><label for="freq-a">Annually or a few times a year</label></div>
                <div class="frequency-option"><input type="radio" id="freq-b" name="fault_frequency" value="biennial" ${savedFrequency === 'biennial' ? 'checked' : ''}><label for="freq-b">About once every year or two</label></div>
                <div class="frequency-option"><input type="radio" id="freq-r" name="fault_frequency" value="rare" ${savedFrequency === 'rare' ? 'checked' : ''}><label for="freq-r">Every 3 to 10 years—rare but possible</label></div>
                <div class="frequency-option"><input type="radio" id="freq-vr" name="fault_frequency" value="very_rare" ${savedFrequency === 'very_rare' ? 'checked' : ''}><label for="freq-vr">Once every 10–30 years—very rare</label></div>
                <div class="frequency-option"><input type="radio" id="freq-n" name="fault_frequency" value="never" ${savedFrequency === 'never' ? 'checked' : ''}><label for="freq-n">Less than once in 30 years—almost never seen</label></div>
            </div>
            <div class="form-group confidence-group">
                <label for="fault_frequency_confidence">Confidence in your frequency rating:</label>
                <select name="fault_frequency_confidence" id="fault_frequency_confidence" required>
                    <option value="">-- Select --</option>
                    <option value="High" ${savedFrequencyConfidence === 'High' ? 'selected' : ''}>High Confidence</option>
                    <option value="Medium" ${savedFrequencyConfidence === 'Medium' ? 'selected' : ''}>Medium Confidence</option>
                    <option value="Low" ${savedFrequencyConfidence === 'Low' ? 'selected' : ''}>Low Confidence</option>
                </select>
            </div>
        </div>
    `;
}

function goToPreviousFault() {
    if (currentFaultIndex > 0) {
        currentFaultIndex--;
        displayCurrentFault();
        document.getElementById('questionnaire-section').scrollIntoView({ behavior: 'smooth' });
    }
}

function goToNextFault() {
    saveCurrentAnswers();
    currentFaultIndex++;
    if (currentFaultIndex < faults.length) {
        displayCurrentFault();
        document.getElementById('questionnaire-section').scrollIntoView({ behavior: 'smooth' });
    } else {
        const bottomProgressHTML = `<div class="bottom-progress">${faults.length} / ${faults.length}</div>`;
        faultContainer.innerHTML = `
            <h2>Thank You!</h2>
            <p>You have completed the assessment for all faults. Please review your answers or click submit to send your response.</p>
            <div class="button-container">
                 <button type="button" id="prev-fault-btn">Previous Fault</button>
                 ${bottomProgressHTML}
                 <button type="submit">Submit All Answers</button>
            </div>
        `;
        document.getElementById('prev-fault-btn').addEventListener('click', goToPreviousFault);
    }
}

function handleSubmit(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    const formData = new FormData();
    
    // MODIFICATION: Add a placeholder for timestamp and submission_id.
    // The Google Script will ignore the value but this ensures the columns are recognized.
    formData.append('timestamp', new Date().toISOString());
    formData.append('submission_id', 'will be generated by script');
    
    formData.append('position', document.getElementById('position').value);
    formData.append('education', document.getElementById('education').value);
    formData.append('experience', document.getElementById('experience').value);
    formData.append('age', document.getElementById('age').value);
    
    for (const key in answers) {
        if (answers.hasOwnProperty(key)) {
            const answerData = answers[key];
            if (answerData.frequency) formData.append(`${key}_frequency`, answerData.frequency);
            if (answerData.frequencyConfidence) formData.append(`${key}_frequency_confidence`, answerData.frequencyConfidence);
            if (answerData.selectedSymptoms && answerData.selectedSymptoms.length > 0) {
                formData.append(`${key}_selected_symptoms`, answerData.selectedSymptoms.join(', '));
                for (const symptomId in answerData.ratings) {
                    if (answerData.ratings.hasOwnProperty(symptomId)) {
                        const rating = answerData.ratings[symptomId];
                        formData.append(`${key}_${symptomId}_influence`, rating.influence);
                        formData.append(`${key}_${symptomId}_confidence`, rating.confidence);
                    }
                }
            }
        }
    }

    fetch(scriptURL, { method: 'POST', body: formData })
        .then(response => {
            faultContainer.innerHTML = `<h2>Submission successful!</h2><p>Thank you for your contribution. You may now close this window.</p>`;
        })
        .catch(error => {
            faultContainer.innerHTML = `<h2>Error!</h2><p>There was a problem submitting your answers. Please try again or contact us.</p><p><small>Error: ${error.message}</small></p>`;
            submitButton.disabled = false;
            submitButton.textContent = 'Submit All Answers';
        });
}

document.addEventListener('DOMContentLoaded', () => {
    displayCurrentFault();
    form.addEventListener('submit', handleSubmit);
});
