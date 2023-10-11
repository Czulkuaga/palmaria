// import logo from './logo.svg';
import './App.css';
// import CardInfo from './Components/CardInfo';
import React from 'react'
import Sipinner from './Components/Sipinner'
import ApiService from './Service/ApiService'
import ModalInfo from './Components/ModalInfo';

const defaultData = {
  fullname: "",
  email: "",
  phone: "",
  matricula: "",
  metros: "",
  acept: false
}

const OBTAIN_CBL_API_URL = `https://www.medellin.gov.co/site_consulta_pot/BuscarFichaMat.hyg?buscar=`

function App() {

  const [load, setLoad] = React.useState(false)
  const [errors, setErrors] = React.useState({})
  const [formData, setFormData] = React.useState(defaultData)
  // const [dir, setDir] = React.useState(null)
  const [cbml, setCbml] = React.useState(null)
  const [features, setFeatures] = React.useState([])

  const fetchPOT = React.useRef(null)

  // console.log(features.length)

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

    if (formData.matricula === "") newErrors.matricula = 'Debes indicar la matricula del terreno para poder realizar la consulta.';
    if (formData.metros === "") newErrors.metros = 'Debes especificar la cantidad de metros a consultar.';
    if (formData.fullname === "") newErrors.fullname = 'El nombre completo es requerido.';
    if (formData.email === "") newErrors.email = 'El correo electrónico es requerido.';
    if (formData.phone === "") newErrors.phone = 'El número de celular es requerido.';
    if (formData.acept === false) newErrors.acept = 'Si debes continuar, acepta los términos y condiciones del sitio.';

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
    // setFormData({
    //   matricula: formData.matricula,
    //   metros: convertDotsForComa(formData.metros),
    //   acept: formData.acept
    // })
    try {
      const obtainCBL = await ApiService.obtainCBL(OBTAIN_CBL_API_URL, formData)
      // console.log(obtainCBL)

      if (obtainCBL.data.cbml === "null") {
        setLoad(false)
        setFormData(defaultData)
        // restartForm()
        setFeatures([])
        setFormData({ matricula: "", metros: "", acept: false })
        checkboxForm.checked = false
        showmodal()
        return
      }
      // console.log(features.length)
      const obtainPOT48Data = await ApiService.obtainPOT48Data(obtainCBL.data.cbml)
      // console.log(obtainPOT48Data)
      if (obtainPOT48Data.code !== '200') {
        setLoad(false)
        setFormData(defaultData)
        return
      }
      // console.log(obtainPOT48Data.data.features[0].geometry.rings)
      const ring1 = obtainPOT48Data.data.features[0].geometry.rings[0]
      // console.log(obtainPOT48Data.data)
      const xmin = ring1[0][0]
      const ymin = ring1[0][1]
      const xmax = ring1[3][0]
      const ymax = ring1[3][1]

      setCbml(obtainCBL.data.cbml)
      const spartialReference = obtainPOT48Data.data.spatialReference

      const obtainM2value = await ApiService.obtainValueM2(xmin, ymin, xmax, ymax, spartialReference)
      // console.log(obtainM2value)

      setFeatures(obtainM2value.data.features)
      // setFormData({matricula:"", metros:""})
      // setDir(obtainCBL.data.direccion)
      setLoad(false)
      // restartForm()
    } catch (error) {
      setLoad(false)
      console.log(error)
      setFormData(defaultData)
    }
  }

  return (
    <>
      {/* Quote Start */}
      <div className=" bg-simulador">
        <div className="container-xxl pt-3">
          <div className="container">

            <div className="row g-5">

              <div className="col-lg-8 wow fadeInUp pt-5" data-wow-delay="0.5s">
                <h2 className="title-simulador mb-4 ">Simulador de pago para obligaciones urbanísticas </h2>

                <p className="descrip-simulador mb-5">Aquí podrás conocer en detalle la información correspondiente para tus obligaciones urbanísticas pendientes con el municipio de medellín.</p>
                <div className="container">

                  <div className="row g-3">

                    <form className='form-display' ref={fetchPOT} onSubmit={(e) => handleSubmit(e)}>

                      <div className="row g-3">

                        <div className="col-sm-4 mb-4 mb-md-5 ">
                          <div className="form-floating">
                            <input name={"fullname"} value={formData.fullname} type="text" className="form-control" id="fullname" aria-describedby="fullname" onChange={(e) => inputChangeHandler(e)} />
                            <label htmlFor="fullname"> Nombre y apellidos*</label>
                            {
                              errors.fullname ? <div id="fullanmeHelp" className="form-text text-danger text-shadow text-start">{errors.fullname}</div> : <div id="fullnameHelp" className="form-text text-white text-start"></div>
                            }
                          </div>
                        </div>

                        <div className="col-sm-4 mb-4 mb-md-5 ">
                          <div className="form-floating">
                            <input name={"email"} value={formData.email} type="text" className="form-control" id="email" aria-describedby="email" onChange={(e) => inputChangeHandler(e)} />
                            <label htmlFor="email"> Correo electronico*</label>
                            {
                              errors.email ? <div id="emailHelp" className="form-text text-danger text-shadow text-start">{errors.email}</div> : <div id="emailHelp" className="form-text text-white text-start"> </div>
                            }
                          </div>
                        </div>
                        <div className="col-sm-4 mb-4 mb-md-5 ">
                          <div className="form-floating">
                            <input name={"phone"} value={formData.phone} type="number" className="form-control" id="phone" aria-describedby="phone" onChange={(e) => inputChangeHandler(e)} />
                            <label htmlFor="phone">Número Celular*</label>
                            {
                              errors.phone ? <div id="phoneHelp" className="form-text text-danger text-shadow text-start">{errors.phone}</div> : <div id="phoneHelp" className="form-text text-white text-start"> </div>
                            }
                          </div>
                        </div>

                        <div className="col-sm-6 mb-md-1 mb-4">
                          <div className="form-floating">
                            <input name={"matricula"} value={formData.matricula} type="number" className="form-control" id="NumMatricula" aria-describedby="numMatriculaHelp" onChange={(e) => inputChangeHandler(e)} />
                            <label htmlFor="NumMatricula"> Número de matricula</label>
                            {
                              errors.matricula ? <div id="numMatriculaHelp" className="form-text text-danger text-shadow text-start">{errors.matricula}</div> : <div id="numMatriculaHelp" className="form-text text-white text-start"> Sólo se permiten valores numéricos.</div>
                            }
                          </div>
                        </div>

                        <div className="col-sm-6 mb-md-1 mb-4">
                          <div className="form-floating">
                            <input name={"metros"} value={formData.metros} type="string" className="form-control" id="Metros" aria-describedby="metrosHelp" onChange={(e) => inputChangeHandler(e)} />
                            <label htmlFor="Metros">M2 del lote</label>
                            {
                              errors.metros ? <div id="metrosHelp" className="form-text text-danger text-shadow text-start">{errors.metros}</div> : <div id="metrosHelp" className="form-text text-white text-start">Valor numérico de metros cuadrados </div>
                            }
                          </div>
                        </div>

                        <div className="mb-3 form-check ms-2 text-start text-white">
                          <input name={"acept"} type="checkbox" className="form-check-input " id="exampleCheck1" onChange={(e) => inputChangeHandler(e)} />
                          <label className="form-check-label" htmlFor="exampleCheck1">He leído y acepto los términos y condiciones de uso</label>
                          {
                            errors.acept && <div id="metrosHelp" className="form-text text-danger text-shadow">{errors.acept}</div>
                          }
                        </div>

                        {
                          load ? <>
                            <Sipinner />
                          </> :
                            <>
                              <div className="col-3 p-0 mb-5">
                                <button type="submit" className="btn btn-warning rounded-pill py-3 px-5">Calcular</button>
                              </div>
                            </>
                        }
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="col-lg-4 px-4 wow fadeInUp  d-lg-block d-none" data-wow-delay="0.1s">
                <picture className="second animated fadeInUp">
                  <source media="(min-width: 767px)" srcSet="https://aliatic.com.co/wp-content/uploads/2023/10/img-simulador-2.png" />
                  <img style={{ marginTop: '150px', width: '550px' }} src="https://aliatic.com.co/wp-content/uploads/2023/10/img-simulador-2.png" alt="" />
                </picture>
              </div>

            </div>
          </div>
        </div>

      </div>
      {/* Quote Start */}

      {/* simulador Start */}
      {
        features.length === 0 && (
          <>
            {/* Vista Mobile */}

            {/* inicio simulador mobile collapse */}

            <div className=" mb-5 pb-5 d-md-none d-block">
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
                          <div className="text-primary price-mobile"> <span><strong>$0</strong></span> </div>
                        </div>
                        <div className="mt-2">
                          <div className="row px-1">
                            <div className="col text-center py-1 px-0 "><p className="mb-1 fw-light p-14">Comuna</p> <span className="fw-semibold font-dates">0</span></div>
                            <div className="col-auto text-center py-1 px-0"><p className="mb-1 fw-light p-14">Cód catastral</p> <span className="fw-semibold font-dates">*cbml*</span></div>
                            <div className="col text-center py-1"><p className="mb-1 fw-light p-14">M2 lote</p> <span className="fw-semibold font-dates"></span></div>
                            <div className="col text-center py-1"><p className="mb-1 fw-light p-14">Valor M2 </p> <span className="fw-semibold font-dates">$0</span></div>
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
                          <div className="text-efectivo price-mobile"> <span><strong>$0</strong></span> </div>
                        </div>
                        <div className="mt-2">
                          <div className="row px-1">
                            <div className="col text-center py-1 px-0 "><p className="mb-1 fw-light p-14">Total</p> <span className="fw-semibold font-dates">$0</span></div>
                            <div className="col-auto text-center py-1 px-0"><p className="mb-1 fw-light p-14">Recargo efectivo</p> <span className="fw-semibold font-dates text-danger">+15%</span></div>
                            <div className="col text-center py-1"><p className="mb-1 fw-light p-14">Recargo total</p> <span className="fw-semibold font-dates text-danger">$0</span></div>
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
                          <div className="text-success price-mobile fs-5 fw-bold"> <span><strong>$0</strong></span> </div>
                        </div>
                        <div className="mt-2">
                          <div className="row px-0">
                            <div className="col text-center py-1  "><p className="mb-1 fw-light p-14">Total</p> <span className="fw-semibold font-dates">$0</span></div>
                            <div className="col text-center py-1 px-0"><p className="mb-1 fw-light p-14"> Efectivo</p> <span className="fw-semibold font-dates text-success">-15%</span></div>
                            <div className="col text-center py-1"><p className="mb-1 fw-light p-14">Adicional</p> <span className="fw-semibold font-dates text-success">-15%</span></div>
                            <div className="col text-center py-1"><p className="mb-1 fw-light p-14">Des Total </p> <span className="fw-semibold font-dates text-success">$0</span></div>
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
            </div>

            {/* fin simulador mobile collapse */}

            {/* Vista Tablet y Escritorio */}

            <div className="mb-5 pb-5 margin-calculo d-md-block d-none">
              <div className="container-xxl">
                <div className="container z-index-sec">
                  <div className="row g-0 feature-row">
                    <div className="col-md-6 col-lg-4 wow fadeIn mb-3" data-wow-delay="0.1s">
                      <div className="feature-item-1 border h-100 px-3 py-4 ">
                        <div className="btn-square bg-light rounded-circle mb-4" style={{ width: "50px", height: "50px", margin: "0px auto" }}>
                          <img className="img-fluid" src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-1.svg" alt="Icon" />
                        </div>
                        <h5 className="mb-3 text-center title-detalle text-primary">Calculo de obligación</h5>
                        <ul className="list-group list-group-flush list-simulador mb-4">
                          <li className="list-group-item">Comuna <span className="float-end"><strong>{"0"}</strong></span></li>
                          <li className="list-group-item">Codigo catastral<span className="float-end"><strong>*{'cbml'}*</strong></span></li>
                          <li className="list-group-item">M2 calculados <span className="float-end"><strong>{formData.metros}</strong></span></li>
                          <li className="list-group-item">Valor por m2<span className="float-end"><strong>$ {addDotThousands(0.00)}</strong></span></li>

                        </ul>
                        <div className="cont-valor-simulador bg-primary">Total obligaciones <br /> <span style={{ fontSize: "25px", fontWeight: 600 }}>$ {addDotThousands(0.0)}</span> </div>
                      </div>
                    </div>

                    <div className="col-md-6 col-lg-4 wow fadeIn mb-3" data-wow-delay="0.1s">
                      <div className="feature-item-1 border h-100 px-3 py-4 ">
                        <div className="btn-square bg-light rounded-circle mb-4" style={{ width: "50px", height: "50px", margin: "0px auto" }}>
                          <img className="img-fluid" src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-2.svg" alt="Icon" />
                        </div>
                        <h5 className="mb-3 text-center title-detalle text-efectivo">Si pagas en efectivo</h5>
                        <ul className="list-group list-group-flush list-simulador mb-4">
                          <li className="list-group-item">Total obligaciones <span className="float-end"><strong>$ {addDotThousands(0.0)}</strong></span></li>
                          <li className="list-group-item">Recargo su pagas en efectivo <span className="float-end text-danger"><strong>+15%</strong></span></li>
                          <li className="list-group-item">Total recargo <span className="float-end text-danger"><strong>$ {addDotThousands(0.0)}</strong></span></li>


                        </ul>
                        <div className="cont-valor-simulador bg-efectivo">Total pago en efectivo  <br /> <span style={{ fontSize: "25px", fontWeight: 600 }}>$ {addDotThousands(0.0)}</span> </div>
                      </div>
                    </div>

                    <div className="col-md-12 col-lg-4 wow fadeIn mb-3" data-wow-delay="0.1s">
                      <div className="feature-item border h-100 px-3 py-4 ">
                        <div className="btn-square bg-light rounded-circle mb-4" style={{ width: "50px", height: "50px", margin: "0px auto" }}>
                          <img className="img-fluid" src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-1.svg" alt="Icon" />
                        </div>
                        <h5 className="mb-3 text-center title-detalle text-green">Si pagas con inmoterra</h5>
                        <ul className="list-group list-group-flush list-simulador mb-4">
                          <li className="list-group-item">Total obligaciones <span className="float-end"><strong>$ {addDotThousands(0.0)}</strong></span></li>
                          <li className="list-group-item">Recargo  pago en efectivo <span className="float-end"><strong className="text-success">-15%</strong></span></li>
                          <li className="list-group-item">Descuento obligaciones <span className="float-end"><strong className="text-success">-15%</strong></span></li>
                          <li className="list-group-item">Descuento total <span className="float-end text-success"><strong>$ {addDotThousands(0.0)}</strong></span></li>
                        </ul>
                        <div className="cont-valor-simulador bg-green-cont">Total obligaciones <br /> <span style={{ fontSize: "25px", fontWeight: 600 }}>$ {addDotThousands(0.0)}</span> </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      }
      {
        features.length < 2 && features.map((feature, index) => (
          <React.Fragment key={index}>
            {/* Vista Mobile */}

            {/* inicio simulador mobile collapse */}

            <div className=" mb-5 pb-5 d-md-none d-block">
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
            </div>

            {/* fin simulador mobile collapse */}

            {/* Vista Tablet y Escritorio */}

            <div className="mb-5 pb-5 margin-calculo d-md-block d-none">
              <div className="container-xxl mt-n5">
                <div className="container z-index-sec">
                  <div className="row g-0 feature-row">
                    <div className="col-md-6 col-lg-4 wow fadeIn mb-3" data-wow-delay="0.1s">
                      <div className="feature-item-1 border h-100 px-3 py-4 ">
                        <div className="btn-square bg-light rounded-circle mb-4" style={{ width: "50px", height: "50px", margin: "0px auto" }}>
                          <img className="img-fluid" src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-1.svg" alt="Icon" />
                        </div>
                        <h5 className="mb-3 text-center title-detalle text-primary">Calculo de obligación</h5>
                        <ul className="list-group list-group-flush list-simulador mb-4">
                          <li className="list-group-item">Comuna <span className="float-end"><strong>{feature.attributes.COMUNA}</strong></span></li>
                          <li className="list-group-item">Codigo catastral<span className="float-end"><strong>*{cbml}*</strong></span></li>
                          <li className="list-group-item">M2 calculados <span className="float-end"><strong>{formData.metros}</strong></span></li>
                          <li className="list-group-item">Valor por m2<span className="float-end"><strong>$ {addDotThousands(feature.attributes.VALOR_M2)}</strong></span></li>

                        </ul>
                        <div className="cont-valor-simulador bg-primary">Total obligaciones <br /> <span style={{ fontSize: "25px", fontWeight: 600 }}>$ {addDotThousands(parseInt(feature.attributes.VALOR_M2 * parseFloat(formData.metros)))}</span> </div>
                      </div>
                    </div>

                    <div className="col-md-6 col-lg-4 wow fadeIn mb-3" data-wow-delay="0.1s">
                      <div className="feature-item-1 border h-100 px-3 py-4 ">
                        <div className="btn-square bg-light rounded-circle mb-4" style={{ width: "50px", height: "50px", margin: "0px auto" }}>
                          <img className="img-fluid" src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-2.svg" alt="Icon" />
                        </div>
                        <h5 className="mb-3 text-center title-detalle text-efectivo">Si pagas en efectivo</h5>
                        <ul className="list-group list-group-flush list-simulador mb-4">
                          <li className="list-group-item">Total obligaciones <span className="float-end"><strong>$ {addDotThousands((feature.attributes.VALOR_M2 * parseFloat(formData.metros)).toFixed(2))}</strong></span></li>
                          <li className="list-group-item">Recargo su pagas en efectivo <span className="float-end text-danger"><strong>+15%</strong></span></li>
                          <li className="list-group-item">Total recargo <span className="float-end text-danger"><strong>$ {addDotThousands((feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15).toFixed(2))}</strong></span></li>


                        </ul>
                        <div className="cont-valor-simulador bg-efectivo">Total pago en efectivo  <br /> <span style={{ fontSize: "25px", fontWeight: 600 }}>$ {addDotThousands(parseInt((feature.attributes.VALOR_M2 * parseFloat(formData.metros)) + (feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15)))}</span> </div>
                      </div>
                    </div>

                    <div className="col-md-12 col-lg-4 wow fadeIn mb-3" data-wow-delay="0.1s">
                      <div className="feature-item border h-100 px-3 py-4 ">
                        <div className="btn-square bg-light rounded-circle mb-4" style={{ width: "50px", height: "50px", margin: "0px auto" }}>
                          <img className="img-fluid" src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-1.svg" alt="Icon" />
                        </div>
                        <h5 className="mb-3 text-center title-detalle text-green">Si pagas con inmoterra</h5>
                        <ul className="list-group list-group-flush list-simulador mb-4">
                          <li className="list-group-item">Total obligaciones <span className="float-end"><strong>$ {addDotThousands((((parseInt(feature.attributes.VALOR_M2) * parseFloat(formData.metros)) + (parseInt(feature.attributes.VALOR_M2) * parseFloat(formData.metros) * 0.15))).toFixed(2))}</strong></span></li>
                          <li className="list-group-item">Recargo  pago en efectivo <span className="float-end"><strong className="text-success">-15%</strong></span></li>
                          <li className="list-group-item">Descuento obligaciones <span className="float-end"><strong className="text-success">-15%</strong></span></li>
                          <li className="list-group-item">Descuento total <span className="float-end text-success"><strong>$ {addDotThousands(((feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15) + (feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15)).toFixed(2))}</strong></span></li>
                        </ul>
                        <div className="cont-valor-simulador bg-green-cont">Total obligaciones <br /> <span style={{ fontSize: "25px", fontWeight: 600 }}>$ {addDotThousands(parseInt(((feature.attributes.VALOR_M2 * parseFloat(formData.metros)) + (feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15)) - ((feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15) + (feature.attributes.VALOR_M2 * parseFloat(formData.metros) * 0.15))))}</span> </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </React.Fragment>

        ))
      }
      {
        features.length >= 2 && (
          <>
            <div className='my-5'>
              <h5 className='text-center'>Actualmente no se pueden mostrar los datos, por favor contáctese con nostros.</h5>
            </div>

            {/* Vista Mobile */}

            {/* inicio simulador mobile collapse */}

            <div className=" mb-5 pb-5 d-md-none d-block">
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
                          <div className="text-primary price-mobile"> <span><strong>$0</strong></span> </div>
                        </div>
                        <div className="mt-2">
                          <div className="row px-1">
                            <div className="col text-center py-1 px-0 "><p className="mb-1 fw-light p-14">Comuna</p> <span className="fw-semibold font-dates">0</span></div>
                            <div className="col-auto text-center py-1 px-0"><p className="mb-1 fw-light p-14">Cód catastral</p> <span className="fw-semibold font-dates">*cbml*</span></div>
                            <div className="col text-center py-1"><p className="mb-1 fw-light p-14">M2 lote</p> <span className="fw-semibold font-dates"></span></div>
                            <div className="col text-center py-1"><p className="mb-1 fw-light p-14">Valor M2 </p> <span className="fw-semibold font-dates">$0</span></div>
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
                          <div className="text-efectivo price-mobile"> <span><strong>$0</strong></span> </div>
                        </div>
                        <div className="mt-2">
                          <div className="row px-1">
                            <div className="col text-center py-1 px-0 "><p className="mb-1 fw-light p-14">Total</p> <span className="fw-semibold font-dates">$0</span></div>
                            <div className="col-auto text-center py-1 px-0"><p className="mb-1 fw-light p-14">Recargo efectivo</p> <span className="fw-semibold font-dates text-danger">+15%</span></div>
                            <div className="col text-center py-1"><p className="mb-1 fw-light p-14">Recargo total</p> <span className="fw-semibold font-dates text-danger">$0</span></div>
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
                          <div className="text-success price-mobile fs-5 fw-bold"> <span><strong>$0</strong></span> </div>
                        </div>
                        <div className="mt-2">
                          <div className="row px-0">
                            <div className="col text-center py-1  "><p className="mb-1 fw-light p-14">Total</p> <span className="fw-semibold font-dates">$0</span></div>
                            <div className="col text-center py-1 px-0"><p className="mb-1 fw-light p-14"> Efectivo</p> <span className="fw-semibold font-dates text-success">-15%</span></div>
                            <div className="col text-center py-1"><p className="mb-1 fw-light p-14">Adicional</p> <span className="fw-semibold font-dates text-success">-15%</span></div>
                            <div className="col text-center py-1"><p className="mb-1 fw-light p-14">Des Total </p> <span className="fw-semibold font-dates text-success">$0</span></div>
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
            </div>

            {/* fin simulador mobile collapse */}

            {/* Vista Tablet y Escritorio */}


            <div className="mb-5 pb-5 margin-calculo d-md-block d-none">
              <div className="container-xxl">
                <div className="container z-index-sec">
                  <div className="row g-0 feature-row">
                    <div className="col-md-6 col-lg-4 wow fadeIn mb-3" data-wow-delay="0.1s">
                      <div className="feature-item-1 border h-100 px-3 py-4 ">
                        <div className="btn-square bg-light rounded-circle mb-4" style={{ width: "50px", height: "50px", margin: "0px auto" }}>
                          <img className="img-fluid" src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-1.svg" alt="Icon" />
                        </div>
                        <h5 className="mb-3 text-center title-detalle text-primary">Calculo de obligación</h5>
                        <ul className="list-group list-group-flush list-simulador mb-4">
                          <li className="list-group-item">Comuna <span className="float-end"><strong>{"0"}</strong></span></li>
                          <li className="list-group-item">Codigo catastral<span className="float-end"><strong>*{'cbml'}*</strong></span></li>
                          <li className="list-group-item">M2 calculados <span className="float-end"><strong>{formData.metros}</strong></span></li>
                          <li className="list-group-item">Valor por m2<span className="float-end"><strong>$ {addDotThousands(0.00)}</strong></span></li>

                        </ul>
                        <div className="cont-valor-simulador bg-primary">Total obligaciones <br /> <span style={{ fontSize: "25px", fontWeight: 600 }}>$ {addDotThousands(0.0)}</span> </div>
                      </div>
                    </div>

                    <div className="col-md-6 col-lg-4 wow fadeIn mb-3" data-wow-delay="0.1s">
                      <div className="feature-item-1 border h-100 px-3 py-4 ">
                        <div className="btn-square bg-light rounded-circle mb-4" style={{ width: "50px", height: "50px", margin: "0px auto" }}>
                          <img className="img-fluid" src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-2.svg" alt="Icon" />
                        </div>
                        <h5 className="mb-3 text-center title-detalle text-efectivo">Si pagas en efectivo</h5>
                        <ul className="list-group list-group-flush list-simulador mb-4">
                          <li className="list-group-item">Total obligaciones <span className="float-end"><strong>$ {addDotThousands(0.0)}</strong></span></li>
                          <li className="list-group-item">Recargo su pagas en efectivo <span className="float-end text-danger"><strong>+15%</strong></span></li>
                          <li className="list-group-item">Total recargo <span className="float-end text-danger"><strong>$ {addDotThousands(0.0)}</strong></span></li>


                        </ul>
                        <div className="cont-valor-simulador bg-efectivo">Total pago en efectivo  <br /> <span style={{ fontSize: "25px", fontWeight: 600 }}>$ {addDotThousands(0.0)}</span> </div>
                      </div>
                    </div>

                    <div className="col-md-12 col-lg-4 wow fadeIn mb-3" data-wow-delay="0.1s">
                      <div className="feature-item border h-100 px-3 py-4 ">
                        <div className="btn-square bg-light rounded-circle mb-4" style={{ width: "50px", height: "50px", margin: "0px auto" }}>
                          <img className="img-fluid" src="https://aliatic.com.co/wp-content/uploads/2023/10/icon-simulador-1.svg" alt="Icon" />
                        </div>
                        <h5 className="mb-3 text-center title-detalle text-green">Si pagas con inmoterra</h5>
                        <ul className="list-group list-group-flush list-simulador mb-4">
                          <li className="list-group-item">Total obligaciones <span className="float-end"><strong>$ {addDotThousands(0.0)}</strong></span></li>
                          <li className="list-group-item">Recargo  pago en efectivo <span className="float-end"><strong className="text-success">-15%</strong></span></li>
                          <li className="list-group-item">Descuento obligaciones <span className="float-end"><strong className="text-success">-15%</strong></span></li>
                          <li className="list-group-item">Descuento total <span className="float-end text-success"><strong>$ {addDotThousands(0.0)}</strong></span></li>
                        </ul>
                        <div className="cont-valor-simulador bg-green-cont">Total obligaciones <br /> <span style={{ fontSize: "25px", fontWeight: 600 }}>$ {addDotThousands(0.0)}</span> </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      }

      {/* simulador End */}

      {/* Footer Start */}
      {/* <div className="container-fluid bg-dark footer mt-5 py-5 wow fadeIn" data-wow-delay="0.1s">
        <div className="container py-5">
          <div className="row g-5">
            <div className="col-lg-3 col-md-6">
              <h4 className="text-white mb-4">Our Office</h4>
              <p className="mb-2"><i className="fa fa-map-marker-alt me-3"></i>123 Street, New York, USA</p>
              <p className="mb-2"><i className="fa fa-phone-alt me-3"></i>+012 345 67890</p>
              <p className="mb-2"><i className="fa fa-envelope me-3"></i>info@example.com</p>
              <div className="d-flex pt-3">
                <a className="btn btn-square btn-light rounded-circle me-2" href="/"><i className="fab fa-twitter"></i></a>
                <a className="btn btn-square btn-light rounded-circle me-2" href="/"><i className="fab fa-facebook-f"></i></a>
                <a className="btn btn-square btn-light rounded-circle me-2" href="/"><i className="fab fa-youtube"></i></a>
                <a className="btn btn-square btn-light rounded-circle me-2" href="/"><i className="fab fa-linkedin-in"></i></a>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <h4 className="text-white mb-4">Quick Links</h4>
              <a className="btn btn-link" href="/">About Us</a>
              <a className="btn btn-link" href="/">Contact Us</a>
              <a className="btn btn-link" href="/">Our Services</a>
              <a className="btn btn-link" href="/">Terms & Condition</a>
              <a className="btn btn-link" href="/">Support</a>
            </div>
            <div className="col-lg-3 col-md-6">
              <h4 className="text-white mb-4">Business Hours</h4>
              <p className="mb-1">Monday - Friday</p>
              <h6 className="text-light">09:00 am - 07:00 pm</h6>
              <p className="mb-1">Saturday</p>
              <h6 className="text-light">09:00 am - 12:00 pm</h6>
              <p className="mb-1">Sunday</p>
              <h6 className="text-light">Closed</h6>
            </div>
            <div className="col-lg-3 col-md-6">
              <h4 className="text-white mb-4">Newsletter</h4>
              <p>Dolor amet sit justo amet elitr clita ipsum elitr est.</p>
              <div className="position-relative w-100">
                <input className="form-control bg-transparent w-100 py-3 ps-4 pe-5" type="text" placeholder="Your email" />
                <button type="button" className="btn btn-light py-2 position-absolute top-0 end-0 mt-2 me-2">SignUp</button>
              </div>
            </div>
          </div>
        </div>
      </div> */}
      {/* Footer End */}

      {/* Copyright Start */}
      {/* <div className="container-fluid copyright py-4">
        <div className="container">
          <div className="row">
            <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
              &copy; <a className="fw-medium text-light" href="/">Inmoterra</a>, todos los derechos reservados.
            </div>
            <div className="col-md-6 text-center text-md-end">
              Designed By <a className="fw-medium text-light" href="https://aliatic.com.co/">Aliatic</a>
            </div>
          </div>
        </div>
      </div> */}
      {/* Copyright End */}

      {/* Back to Top */}
      {/* <a href="/" className="btn btn-lg btn-primary btn-lg-square rounded-circle back-to-top"><i className="bi bi-arrow-up"></i></a> */}

      <button hidden id='btn-showModal' type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
        Launch demo modal
      </button>

      <ModalInfo message={"No hay datos para mostrar"} />
    </>
  );
}

export default App;
