// import logo from './logo.svg';
import './App.css';
// import CardInfo from './Components/CardInfo';
import React from 'react'
import ApiService from './Service/ApiService'
import ModalInfo from './Components/ModalInfo'
import ReCAPTCHA from "react-google-recaptcha"
import Spinner2 from './Components/Spinner2';

const defaultData = {
  fullname: "",
  email: "",
  phone: "",
  matricula: "",
  metros: "",
  acept: false,
  captcha: null
}

const OBTAIN_CBL_API_URL = `https://www.medellin.gov.co/site_consulta_pot/BuscarFichaMat.hyg?buscar=`
const SITE_KEY = "6Ldjb7MoAAAAACzrcpVi_rgQEQyoPkbOyYs8SAkz"
function App() {

  const [load, setLoad] = React.useState(false)
  const [errors, setErrors] = React.useState({})
  const [formData, setFormData] = React.useState(defaultData)
  // const [dir, setDir] = React.useState(null)
  const [cbml, setCbml] = React.useState(null)
  const [features, setFeatures] = React.useState([])
  const [modalMessage, setModalMessage] = React.useState(null)

  const fetchPOT = React.useRef(null)
  const captcha = React.useRef(null)

  // console.log(features)

  //RegExp
  const validarMatricula = /^[0-9]{1,8}$/g
  const validarMetros = /^\d+(?:[.]\d+)?$/g
  let validNumber = /^[0-9]{10}$/g
  let validEmail = /^[A-Za-z0-9!#$%&'*+/=?^_{|}~-]+(?:\.[A-Za-z0-9*+/={|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/g

  const checkboxForm = document.getElementById("exampleCheck1");

  const showmodal = () => {
    const btnmodal = document.getElementById('btn-showModal')
    btnmodal.click()
  }

  const fetchCaptcha = async (value) => {
    setFormData({ ...formData, captcha: value })
  }

  function addDotThousands(numero) {
    // Convertir el número a una cadena de texto
    let numeroString = numero.toString();

    // Separar la parte entera de la parte decimal (si existe)
    let partes = numeroString.split('.');
    let parteEntera = partes[0];
    let parteDecimal = partes.length > 1 ? '.' + partes[1] : '';

    // Agregar los puntos de mil a la parte entera
    parteEntera = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    // Devolver el número con los puntos de mil agregados
    return parteEntera + parteDecimal;
  }

  const inputChangeHandler = e => {
    setErrors({})
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value.replace(',', '.');
    const name = target.name;

    setFormData(formData => {
      return {
        ...formData,
        [name]: value
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoad(true)
    const newErrors = {}

    // console.log(formData)

    if (formData.matricula === "") newErrors.matricula = 'Debes indicar la matricula del terreno para poder realizar la consulta.';
    if (formData.metros === "") newErrors.metros = 'Debes especificar la cantidad de metros a consultar.';
    if (formData.fullname === "") newErrors.fullname = 'El nombre completo es requerido.';
    if (formData.email === "") newErrors.email = 'El correo electrónico es requerido.';
    if (formData.phone === "") newErrors.phone = 'El número de celular es requerido.';
    if (formData.acept === false) newErrors.acept = 'Si debes continuar, acepta los términos y condiciones del sitio.';
    if (formData.captcha === null) newErrors.captcha = 'El captcha no es válido';

    if (formData.matricula !== "") {
      let isValidNumContact = formData.matricula.match(validarMatricula)
      if (!isValidNumContact) {
        newErrors.matricula = 'La matricula solo puede estar compuesta por números y no debe tener más de 8 caracteres.';
      }
    }

    if (formData.metros !== "") {
      let isValidNumContact = formData.metros.match(validarMetros)
      if (!isValidNumContact) {
        newErrors.metros = 'Los metros del terreno deben estar compuestos por números y no deben tener más de 6 caracteres.';
      }
    }

    if (formData.phone !== "") {
      let isValidNumContact = formData.phone.match(validNumber)
      if (!isValidNumContact) {
        newErrors.phone = 'Debes ingresar un número de telefono válido, 10 dígitos.';
      }
    }

    if (formData.email !== "") {
      let isValidNumContact = formData.email.match(validEmail)
      if (!isValidNumContact) {
        newErrors.email = 'Debes ingresar un correo electrónico válido. El formato es correo@correo.com.';
      }
    }

    if (Object.keys(newErrors).length === 0) {
      postData(formData)
    } else {
      setLoad(false)
      setErrors(newErrors);
      setTimeout(() => {
        setErrors({});
      }, 7000);
    }
  }

  const postData = async (formData) => {

    try {

      const obtainCBL = await ApiService.obtainCBL(OBTAIN_CBL_API_URL, formData)

      // console.log(obtainCBL)

      if (obtainCBL.code === '200') {

        if (obtainCBL.data.cbml === "null") {
          setLoad(false)
          setFormData({ ...defaultData, fullname: formData.fullname, email: formData.email, phone: formData.phone })
          setFeatures([])
          captcha.current.reset()
          checkboxForm.checked = false
          setModalMessage("Las consulta de la matricula no devolvió resulltados")
          showmodal()
          return
        }

        const obtainPOT48Data = await ApiService.obtainPOT48Data(obtainCBL.data.cbml)

        if (obtainPOT48Data.code !== '200') {
          setLoad(false)
          setFormData({ ...defaultData, fullname: formData.fullname, email: formData.email, phone: formData.phone })
          setFeatures([])
          checkboxForm.checked = false
          setModalMessage("Hubo un error al devolver la información")
          showmodal()
          return
        }

        const ring1 = obtainPOT48Data.data.features[0].geometry.rings[0]

        const xmin = ring1[0][0]
        const ymin = ring1[0][1]
        const xmax = ring1[3][0]
        const ymax = ring1[3][1]

        setCbml(obtainCBL.data.cbml)

        const spartialReference = obtainPOT48Data.data.spatialReference

        const obtainM2value = await ApiService.obtainValueM2(xmin, ymin, xmax, ymax, spartialReference)

        if (obtainM2value.code !== '200') {
          setLoad(false)
          setFormData(defaultData)
          setFeatures([])
          setModalMessage("Hubo un error al devolver los resultados")
          showmodal()
          setFormData({ ...defaultData, fullname: formData.fullname, email: formData.email, phone: formData.phone })
          checkboxForm.checked = false
          captcha.current.reset()
        } else {
          // console.log(obtainM2value)
          if (obtainM2value.data.features.length >= 2) {
            checkboxForm.checked = false
            captcha.current.reset()
            setModalMessage("La consulta no puede mostrar los resultados por favor contactese con nosotros.")
            showmodal()
            setFormData({ ...defaultData, fullname: formData.fullname, email: formData.email, phone: formData.phone, matricula: formData.matricula, metros: formData.metros })
            setFeatures(obtainM2value.data.features)
            setLoad(false)
          } else {
            checkboxForm.checked = false
            captcha.current.reset()
            setFormData({ ...defaultData, fullname: formData.fullname, email: formData.email, phone: formData.phone, matricula: formData.matricula, metros: formData.metros })
            setFeatures(obtainM2value.data.features)
            setLoad(false)
          }
        }

      } else {
        showmodal()
        setFormData({ ...defaultData, fullname: formData.fullname, email: formData.email, phone: formData.phone })
        checkboxForm.checked = false
        captcha.current.reset()
      }

    } catch (error) {
      setLoad(false)
      console.log(error)
      setFormData(defaultData)
    }
  }

  return (
    <>

      <main>

        <div className="contact-form">

          <div className="contact-form-box__right">

            <form ref={fetchPOT} onSubmit={(e) => handleSubmit(e)}>

              <div className="container">
                <div className="row">
                  <div className="col-12">
                    <h3 className="text-blue">Simulador de pago para obligaciones urbanísticas</h3>
                    <hr />
                    <p>Aquí podrás conocer en detalle la información correspondiente para tus obligaciones urbanísticas pendientes con el municipio de medellín.</p>
                  </div>
                  <div className="col-12 col-md-6 mb-4">
                    <div className="floating-label-wrap ">
                      <input autoComplete='none' name={'fullname'} value={formData.fullname} onChange={(e) => inputChangeHandler(e)} type="text" className="floating-label-field floating-label-field--s1" id="fullname" placeholder="fullname" />
                      <label htmlFor="fullname" className="floating-label">Nombres y Apellidos*</label>
                      {
                        errors.fullname ? <div id="fullanmeHelp" className="form-text text-danger text-shadow text-start">{errors.fullname}</div> : <div id="fullnameHelp" className="form-text text-white text-start"></div>
                      }
                    </div>
                  </div>
                  <div className="col-12 col-md-6 mb-4">
                    <div className="floating-label-wrap ">
                      <input autoComplete='none' name={"email"} value={formData.email} onChange={(e) => inputChangeHandler(e)} type="text" className="floating-label-field floating-label-field--s1" id="email" placeholder="email" />
                      <label htmlFor="email" className="floating-label">Correo Electonico*</label>
                      {
                        errors.email ? <div id="emailHelp" className="form-text text-danger text-shadow text-start">{errors.email}</div> : <div id="emailHelp" className="form-text text-white text-start"> </div>
                      }
                    </div>
                  </div>

                  <div className="col-12 col-md-6 mb-4">
                    <div className="floating-label-wrap ">
                      <input autoComplete='none' name={"phone"} value={formData.phone} onChange={(e) => inputChangeHandler(e)} type="number" className="floating-label-field floating-label-field--s1" id="phone" placeholder="phone" />
                      <label htmlFor="phone" className="floating-label">Número Celular*</label>
                      {
                        errors.phone ? <div id="phoneHelp" className="form-text text-danger text-shadow text-start">{errors.phone}</div> : <div id="phoneHelp" className="form-text text-white text-start"> </div>
                      }
                    </div>
                  </div>

                  <div className="col-12 col-md-6 mb-4">
                    <div className="floating-label-wrap ">
                      <input autoComplete='none' name={"matricula"} value={formData.matricula} onChange={(e) => inputChangeHandler(e)} type="number" className="floating-label-field floating-label-field--s1" id="matricula" placeholder="matricula" />
                      <label htmlFor="matricula" className="floating-label"> Número de matricula*</label>
                      {
                        errors.matricula ? <div id="numMatriculaHelp" className="form-text text-danger text-shadow text-start">{errors.matricula}</div> : <div id="numMatriculaHelp" className="form-text text-white text-start"> Sólo se permiten valores numéricos.</div>
                      }
                    </div>
                  </div>

                  <div className="col-12 col-md-6 mb-4">
                    <div className="floating-label-wrap ">
                      <input autoComplete='none' name={"metros"} value={formData.metros} onChange={(e) => inputChangeHandler(e)} type="text" className="floating-label-field floating-label-field--s1" id="metros" placeholder="metros" />
                      <label htmlFor="metros" className="floating-label"> M2 del lote*</label>
                      {
                        errors.metros ? <div id="metrosHelp" className="form-text text-danger text-shadow text-start">{errors.metros}</div> : <div id="metrosHelp" className="form-text text-white text-start">Valor numérico de metros cuadrados </div>
                      }
                    </div>
                  </div>


                  <div className="col-12 col-md-6 mb-4">
                    <ReCAPTCHA
                      ref={captcha}
                      sitekey={SITE_KEY}
                      onChange={fetchCaptcha}
                      className='captch-style'
                    />
                    {
                      errors.captcha && <div id="metrosHelp" className="form-text text-danger text-shadow">{errors.captcha}</div>
                    }
                  </div>



                  <div className="col-12 mt-1">
                    <div className="mb-3 form-check ms-2 text-start ">
                      <input name={"acept"} onChange={(e) => inputChangeHandler(e)} type="checkbox" className="form-check-input " id="exampleCheck1" />
                      <label className="form-check-label" htmlFor="exampleCheck1">He leído y acepto los <a className="" target="_blank" rel="noreferrer" href="https://obligacionesurbanisticas.co/wp-content/uploads/2023/10/Terminos-y-condiciones-de-uso-sitio-web.pdf">términos y condiciones de uso</a></label>
                      {
                        errors.acept && <div id="metrosHelp" className="form-text text-danger text-shadow">{errors.acept}</div>
                      }
                    </div>
                  </div>

                  <div className="d-grid gap-2 col-12">
                    {
                      load ? <>
                        <div className='col-12 p-0 mb-1 d-flex justify-content-center'>
                          <Spinner2 />
                        </div>
                      </> :
                        <>
                          <div className="col-12 p-0 mb-5 d-flex justify-content-center">
                            <button type='submit' className="btn btn-green rounded-pill py-3 px-5 mt-4">Calcular</button>
                          </div>
                        </>
                    }
                  </div>

                  {
                    features.length >= 2 && (
                      <div className="d-grid gap-2 col-12">
                        <p>Por el momento no se puede mostrar la información, por favor contáctese con nosotros.</p>
                      </div>
                    )
                  }

                </div>
              </div>
            </form>
          </div>

          {/* Sin Búsqueda */}

          {
            features.length === 0 && (
              <div className="contact-form-box__left">
                <h5 className="text-blue"><img style={{ width: "20px", marginRight: "10px" }} src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-1.svg" alt="Icon" />Calculo de obligación </h5>
                <ul className="list-group list-group-flush list-simulador mb-4">
                  <li className="list-group-item">Matricula<span className="float-end"><strong>0</strong></span></li>
                  <li className="list-group-item">Comuna <span className="float-end"><strong>0</strong></span></li>
                  <li className="list-group-item">Código catastral <span className="float-end"><strong>*cbml*</strong></span></li>
                  <li className="list-group-item">M2 calculados <span className="float-end"><strong>0</strong></span></li>
                  <li className="list-group-item">Valor por m2<span className="float-end"><strong>$0</strong></span></li>
                  <li className="list-group-item"><strong>Total obligaciones</strong><span className="float-end"><strong>$0</strong></span></li>

                </ul>


                <h5 className="text-blue"><img style={{ width: "25px", marginRight: "10px" }} src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-2.svg" alt="Icon" />Si pagas en efectivo </h5>
                <ul className="list-group list-group-flush list-simulador mb-4">
                  <li className="list-group-item">Total obligaciones <span className="float-end"><strong>$0</strong></span></li>
                  <li className="list-group-item">Recargo si pagas en efectivo <span className="float-end"><strong>+15%</strong></span></li>
                  <li className="list-group-item">Total recargo <span className="float-end"><strong>$0</strong></span></li>
                  <li className="list-group-item"><strong>Total pago en efectivo</strong><span className="float-end"><strong>$0</strong></span></li>

                </ul>


                <h5 className="text-success"><img style={{ width: "20px", marginRight: "10px" }} src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-1.svg" alt="Icon" />Si pagas con palmaria</h5>
                <ul className="list-group list-group-flush list-simulador mb-4">
                  <li className="list-group-item">Total obligaciones<span className="float-end"><strong>$0</strong></span></li>
                  <li className="list-group-item">Recargo si pagas en efectivo <span className="float-end"><strong className="text-success">-15%</strong></span></li>
                  <li className="list-group-item">Descuento obligaciones <span className="float-end"><strong className="text-success">-15%</strong></span></li>
                  <li className="list-group-item">Descuento total <span className="float-end"><strong className="text-success">$0</strong></span></li>
                  <li className="list-group-item"><strong>Total pago de obligaciones</strong><span className="float-end"><strong className="text-success">$0</strong></span></li>

                </ul>

              </div>
            )
          }

          {/* Fin sin Búsqueda */}

          {
            features.length < 2 && features.map((feature, index) => (
              <React.Fragment key={index}>
                <div className="contact-form-box__left">
                  <h5 className="text-blue"><img style={{ width: "20px", marginRight: "10px" }} src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-1.svg" alt="Icon" />Calculo de obligación </h5>
                  <ul className="list-group list-group-flush list-simulador mb-4">
                    <li className="list-group-item">Matricula<span className="float-end"><strong>{formData.matricula}</strong></span></li>
                    <li className="list-group-item">Comuna<span className="float-end"><strong>{feature.attributes.COMUNA}</strong></span></li>
                    <li className="list-group-item">Código catastral <span className="float-end"><strong>*{cbml}*</strong></span></li>
                    <li className="list-group-item">M2 calculados <span className="float-end"><strong>{formData.metros}</strong></span></li>
                    <li className="list-group-item">Valor por m2<span className="float-end"><strong>$ {addDotThousands(feature.attributes.VALOR_M2)}</strong></span></li>
                    <li className="list-group-item"><strong>Total obligaciones</strong><span className="float-end"><strong>$ {addDotThousands(parseInt(feature.attributes.VALOR_M2 * parseFloat(formData.metros)))}</strong></span></li>

                  </ul>


                  <h5 className="text-blue"><img style={{ width: "25px", marginRight: "10px" }} src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-2.svg" alt="Icon" />Si pagas en efectivo </h5>
                  <ul className="list-group list-group-flush list-simulador mb-4">
                    <li className="list-group-item">Total obligaciones <span className="float-end"><strong>$ {addDotThousands((feature.attributes.VALOR_M2 * parseFloat(formData.metros)).toFixed(2))}</strong></span></li>
                    <li className="list-group-item">Recargo si pagas en efectivo <span className="float-end"><strong>+15%</strong></span></li>
                    <li className="list-group-item">Total recargo <span className="float-end"><strong>$ {addDotThousands((feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15).toFixed(2))}</strong></span></li>
                    <li className="list-group-item"><strong>Total pago en efectivo</strong><span className="float-end"><strong>$ {addDotThousands(parseInt((feature.attributes.VALOR_M2 * parseFloat(formData.metros)) + (feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15)))}</strong></span></li>
                  </ul>


                  <h5 className="text-success"><img style={{ width: "20px", marginRight: "10px" }} src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-1.svg" alt="Icon" />Si pagas con palmaria</h5>
                  <ul className="list-group list-group-flush list-simulador mb-4">
                    <li className="list-group-item">Total obligaciones<span className="float-end"><strong>$ {addDotThousands((((parseInt(feature.attributes.VALOR_M2) * parseFloat(formData.metros)) + (parseInt(feature.attributes.VALOR_M2) * parseFloat(formData.metros) * 0.15))).toFixed(2))}</strong></span></li>
                    <li className="list-group-item">Recargo si pagas en efectivo <span className="float-end"><strong className="text-success">-15%</strong></span></li>
                    <li className="list-group-item">Descuento obligaciones <span className="float-end"><strong className="text-success">-15%</strong></span></li>
                    <li className="list-group-item">Descuento total <span className="float-end"><strong className="text-success">$ {addDotThousands(((feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15) + (feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15)).toFixed(2))}</strong></span></li>
                    <li className="list-group-item"><strong>Total pago de obligaciones</strong><span className="float-end"><strong className="text-success">$ {addDotThousands(parseInt(((feature.attributes.VALOR_M2 * parseFloat(formData.metros)) + (feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15)) - ((feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15) + (feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15))))}</strong></span></li>

                  </ul>

                </div>

                {/* inicio simulador mobile collapse */}

                {/* <div className="mt-5 d-md-none d-block">
                  <div className=" mt-n5">
                    <div className="container px-1 z-index-sec">

                      <div className="row g-0 ">

                        <div className="col-md-4">
                          <div className="card shadow-lg borde px-1 py-2 mb-4">
                            <div className="d-flex justify-content-between border-bottom border-dark-subtle pb-1 ">
                              <div className="d-flex flex-row align-items-center ">
                                <div className=""> <img className="me-2" style={{ width: "28px" }} src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-1.svg" alt="Icon" /> </div>
                                <div className=" c-details">
                                  <h6 className="mb-0 text-primary title-detalle-mobile">Calculo obligación</h6>
                                </div>
                              </div>
                              <div className="text-primary price-mobile"> <span><strong>$ {addDotThousands(parseInt(feature.attributes.VALOR_M2 * parseFloat(formData.metros)))}</strong></span> </div>
                            </div>
                            <div className="mt-2">
                              <div className="row px-1">
                                <div className="col text-center py-1 px-0 "><p className="mb-1 fw-light p-14">Comuna</p> <span className="fw-semibold font-dates">{feature.attributes.COMUNA}</span></div>
                                <div className="col-auto text-center py-1 px-0"><p className="mb-1 fw-light p-14">Cód catastral</p> <span className="fw-semibold font-dates">*{cbml}*</span></div>
                                <div className="col text-center py-1"><p className="mb-1 fw-light p-14">M2 lote</p> <span className="fw-semibold font-dates">{formData.metros}</span></div>
                                <div className="col text-center py-1"><p className="mb-1 fw-light p-14">Valor M2 </p> <span className="fw-semibold font-dates">$ {addDotThousands(feature.attributes.VALOR_M2)}</span></div>
                              </div>
                              <div className="mt-2">
                                <div className="progress">
                                  <div className="bg-secondary-subtle" role="progressbar" style={{ width: '100%' }} aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="card shadow-lg borde px-1 py-2 mb-4">
                            <div className="d-flex justify-content-between border-bottom border-dark-subtle pb-1 ">
                              <div className="d-flex flex-row align-items-center ">
                                <div className=""> <img className="me-2" style={{ width: '38px' }} src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-2.svg" alt="Icon" /> </div>
                                <div className=" c-details">
                                  <h6 className="mb-0 text-efectivo title-detalle-mobile">PAGO EN EFECTIVO</h6>
                                </div>
                              </div>
                              <div className="text-efectivo price-mobile"> <span><strong>$ {addDotThousands(parseInt((feature.attributes.VALOR_M2 * parseFloat(formData.metros)) + (feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15)))}</strong></span> </div>
                            </div>
                            <div className="mt-2">
                              <div className="row px-1">
                                <div className="col text-center py-1 px-0 "><p className="mb-1 fw-light p-14">Total</p> <span className="fw-semibold font-dates">$ {addDotThousands((feature.attributes.VALOR_M2 * parseFloat(formData.metros)).toFixed(2))}</span></div>
                                <div className="col-auto text-center py-1 px-0"><p className="mb-1 fw-light p-14">Recargo efectivo</p> <span className="fw-semibold font-dates text-danger">+15%</span></div>
                                <div className="col text-center py-1"><p className="mb-1 fw-light p-14">Recargo total</p> <span className="fw-semibold font-dates text-danger">$ {addDotThousands((feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15).toFixed(2))}</span></div>
                              </div>
                              <div className="mt-2">
                                <div className="progress">
                                  <div className="bg-secondary-subtle" role="progressbar" style={{ width: "100%" }} aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-4">
                          <div className="card shadow-lg borde px-2 py-1 mb-4">
                            <div className="d-flex justify-content-between border-bottom border-dark-subtle pb-1 ">
                              <div className="d-flex flex-row align-items-center ">
                                <div className=""> <img className="me-2" style={{ width: "28px" }} src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-1.svg" alt="Icon" /> </div>
                                <div className=" c-details">
                                  <h6 className="mb-0 text-success title-detalle-mobile fw-bold  ">PAGO CON PALMARIA</h6>
                                </div>
                              </div>
                              <div className="text-success price-mobile fs-5 fw-bold"> <span><strong>$ {addDotThousands(parseInt(((feature.attributes.VALOR_M2 * parseFloat(formData.metros)) + (feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15)) - ((feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15) + (feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15))))}</strong></span> </div>
                            </div>
                            <div className="mt-2">
                              <div className="row px-0">
                                <div className="col text-center py-1  "><p className="mb-1 fw-light p-14">Total</p> <span className="fw-semibold font-dates">$ {addDotThousands((((parseInt(feature.attributes.VALOR_M2) * parseFloat(formData.metros)) + (parseInt(feature.attributes.VALOR_M2) * parseFloat(formData.metros) * 0.15))).toFixed(2))}</span></div>
                                <div className="col text-center py-1 px-0"><p className="mb-1 fw-light p-14">Efectivo</p> <span className="fw-semibold font-dates text-success">-15%</span></div>
                                <div className="col text-center py-1"><p className="mb-1 fw-light p-14">Adicional</p> <span className="fw-semibold font-dates text-success">-15%</span></div>
                                <div className="col text-center py-1"><p className="mb-1 fw-light p-14">Des Total </p> <span className="fw-semibold font-dates text-success">$ {addDotThousands(((feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15) + (feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15)).toFixed(2))}</span></div>
                              </div>
                              <div className="mt-2">
                                <div className="progress">
                                  <div className="progress-bar bg-success" role="progressbar" style={{ width: "100%" }} aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                </div> */}

                {/* fin simulador mobile collapse */}
              </React.Fragment>
            ))
          }

          {
            features.length >= 2 && (
              <>
                <div className="contact-form-box__left">
                  <h5 className="text-blue"><img style={{ width: "20px", marginRight: "10px" }} src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-1.svg" alt="Icon" />Calculo de obligación </h5>
                  <ul className="list-group list-group-flush list-simulador mb-4">
                    <li className="list-group-item">Matricula<span className="float-end"><strong>0</strong></span></li>
                    <li className="list-group-item">Comuna <span className="float-end"><strong>0</strong></span></li>
                    <li className="list-group-item">Código catastral <span className="float-end"><strong>*cbml*</strong></span></li>
                    <li className="list-group-item">M2 calculados <span className="float-end"><strong>0</strong></span></li>
                    <li className="list-group-item">Valor por m2<span className="float-end"><strong>$0</strong></span></li>
                    <li className="list-group-item"><strong>Total obligaciones</strong><span className="float-end"><strong>$0</strong></span></li>

                  </ul>


                  <h5 className="text-blue"><img style={{ width: "25px", marginRight: "10px" }} src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-2.svg" alt="Icon" />Si pagas en efectivo </h5>
                  <ul className="list-group list-group-flush list-simulador mb-4">
                    <li className="list-group-item">Total obligaciones <span className="float-end"><strong>$0</strong></span></li>
                    <li className="list-group-item">Recargo si pagas en efectivo <span className="float-end"><strong>+15%</strong></span></li>
                    <li className="list-group-item">Total recargo <span className="float-end"><strong>$0</strong></span></li>
                    <li className="list-group-item"><strong>Total pago en efectivo</strong><span className="float-end"><strong>$0</strong></span></li>

                  </ul>


                  <h5 className="text-success"><img style={{ width: "20px", marginRight: "10px" }} src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-1.svg" alt="Icon" />Si pagas con palmaria</h5>
                  <ul className="list-group list-group-flush list-simulador mb-4">
                    <li className="list-group-item">Total obligaciones<span className="float-end"><strong>$0</strong></span></li>
                    <li className="list-group-item">Recargo si pagas en efectivo <span className="float-end"><strong className="text-success">-15%</strong></span></li>
                    <li className="list-group-item">Descuento obligaciones <span className="float-end"><strong className="text-success">-15%</strong></span></li>
                    <li className="list-group-item">Descuento total <span className="float-end"><strong className="text-success">$0</strong></span></li>
                    <li className="list-group-item"><strong>Total pago de obligaciones</strong><span className="float-end"><strong className="text-success">$0</strong></span></li>

                  </ul>

                </div>
              </>
            )
          }

        </div>

        <button hidden id='btn-showModal' type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
          Launch demo modal
        </button>

        <ModalInfo message={modalMessage} />

      </main>
    </>
  );
}

export default App;
