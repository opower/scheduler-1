import { getAppointmentsForDay } from "helpers/selectors";
import { useReducer, useEffect } from "react";
const axios = require('axios');

const SET_DAY = "SET_DAY";
const SET_APPLICATION_DATA = "SET_APPLICATION_DATA";
const SET_INTERVIEW = "SET_INTERVIEW";

function reducer(state, action) {
  switch (action.type) {
    case SET_DAY:
      return { ...state, day: action.day }
    case SET_APPLICATION_DATA:
      return { ...state, days: action.days, appointments: action.appointments, interviewers: action.interviewers }
    case SET_INTERVIEW: {
      return 
    }
    default:
      throw new Error(
        `Tried to reduce with unsupported action type: ${action.type}`
      );
  }
}

export default function useApplicationData() {
  const [state, dispatch] = useReducer(reducer, {day: "Monday", days: [], appointments: {}, interviewers: {}})

  // const [state, setState] = useState({
  //   day: "Monday",
  //   days: [],
  //   appointments: {}, 
  //   interviewers: {}
  // });

  const setDay = day => setState({ ...state, day });
  
  function bookInterview(id, interview) {
    const appointment = {
      ...state.appointments[id],
      interview: { ...interview }
    };
    const appointments = {
      ...state.appointments,
      [id]: appointment
    };
    return axios.put(`/api/appointments/${id}`, {interview}).then(() => setState({...state, appointments}))
  }

  function cancelInterview(appointmentId) {
    const appointment = {
      ...state.appointments[appointmentId],
      interview: null
    };
    const appointments = {
      ...state.appointments, 
      [appointmentId]: appointment
    }
    return axios.delete(`/api/appointments/${appointmentId}`).then(() => setState({...state, appointments}))
  }

  useEffect(() => {
    Promise.all([
      axios.get("api/days"), 
      axios.get("api/appointments"),
      axios.get("api/interviewers")
    ]).then(([days, appointments, interviewers]) => { 
      setState(prev => ({...prev, days: days.data, appointments: appointments.data, interviewers: interviewers.data}))
    });
  }, [])

  //spots remaining: use apptforday fcn, filter the number of null interviews that day, replace the spot count for day, dependency when appointments state changes
  useEffect(() => {
    const appointmentsForDay = getAppointmentsForDay(state, state.day)
    const emptySpotsForDay = appointmentsForDay.filter(elem => elem.interview === null)
    const updateSpots = state.days.map(days => {
      if (days.name === state.day) {
        days.spots = emptySpotsForDay.length
      }
      return days;
    })
    setState(prev => ({...prev, days: updateSpots}))
}, [state.appointments]) 

  return { state, setDay, bookInterview, cancelInterview }
}