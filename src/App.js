// import logo from './logo.svg';
import './App.css';
// import CardInfo from './Components/CardInfo';
import React from 'react'
import Sipinner from './Components/Sipinner'
import ApiService from './Service/ApiService'

const defaultData = {
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

  //RegExp
  const validarMatricula = /^[0-9]{1,8}$/g
  const validarMetros = /^[0-9]{1,6}$/g

  function addDotThousands(numero) {
    // Convertir el número a una cadena de texto
    let numeroString = numero.toString();

    // Separar la parte entera de la parte decimal (si existe)
    let partes = numeroString.split('.');
    let parteEntera = partes[0];
    let parteDecimal = partes.length > 1 ? ',' + partes[1] : '';

    // Agregar los puntos de mil a la parte entera
    parteEntera = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Devolver el número con los puntos de mil agregados
    return parteEntera + parteDecimal;
  }

  const inputChangeHandler = e => {
    setErrors({})
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
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
    if (formData.acept === false) newErrors.acept = 'Si debes continuar, acepta los términos y condiciones del sitio.';

    if (formData.matricula !== "") {
      let isValidNumContact = formData.matricula.match(validarMatricula)
      if (!isValidNumContact) {
        newErrors.matricula = 'La matricula solo puede estar compuesta por números y no debe tener más de 8 caracteres.';
      }
    }

    if (formData.matricula !== "") {
      let isValidNumContact = formData.metros.match(validarMetros)
      if (!isValidNumContact) {
        newErrors.metros = 'Los metros del terreno deben estar compuestos por números y no deben tener más de 6 caracteres.';
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
      const obtainCBL = await ApiService.obtainCBL(OBTAIN_CBL_API_URL, formData.matricula)
      // console.log(obtainCBL)
      if (obtainCBL.code !== '200') {
        setLoad(false)
        setFormData(defaultData)
        return
      }
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
      // setDir(obtainCBL.data.direccion)
      setLoad(false)
    } catch (error) {
      setLoad(false)
      console.log(error)
      setFormData(defaultData)
    }
  }

  const restartForm = () => {
    setFormData({matricula:"", metros:""})
    // setDir(null)
    setFeatures([])
  }

  return (
    <>
      <header>
        {/* Topbar Start */}
        <div className="container-fluid bg-menu-top text-white d-none d-lg-flex">
          <div className="container py-3">
            <div className="d-flex align-items-center">
              <a href="/">
                <img alt="Logo" className="logo-header" src="/img/logo-inmoterra-blanco.svg" />

              </a>
              <div className="ms-auto d-flex align-items-center">
                <small className="ms-4"><i className="fa fa-map-marker-alt me-3"></i>Calle 10 Poblado, Medellin, Colombia</small>
                <small className="ms-4"><i className="fa fa-envelope me-3"></i>info@inmoterra.com</small>
                <small className="ms-4"><i className="fa fa-phone-alt me-3"></i>+064 345 67890</small>
                <div className="ms-3 d-flex">
                  <a className="btn btn-sm-square btn-light text-primary rounded-circle ms-2" href="/"><i className="fab fa-facebook-f"></i></a>
                  <a className="btn btn-sm-square btn-light text-primary rounded-circle ms-2" href="/"><i className="fab fa-twitter"></i></a>
                  <a className="btn btn-sm-square btn-light text-primary rounded-circle ms-2" href="/"><i className="fab fa-linkedin-in"></i></a>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Topbar End */}
      </header>

      {/* <CardInfo /> */}

      {/* Navbar Start */}
      <div className="container-fluid bg-menu sticky-top">
        <div className="container">
          <nav className="navbar navbar-expand-lg bg-menu navbar-light p-lg-0">

            <button type="button" className="navbar-toggler me-0" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="col-lg-3 ms-lg-n4"><img className="logo-fixed" alt='Logo2' src="/img/logo-horizontal.svg" /> </div>
            <div className="center collapse pt-1 navbar-collapse" id="navbarCollapse">
              <div className="navbar-nav">
                <a href="index.html" className="nav-item nav-link active">Obligaciones Urbanísticas</a>
                <a href="about.html" className="nav-item nav-link">Nosotros</a>


                <div className="nav-item dropdown">
                  <a href="#" className="nav-link dropdown-toggle" data-bs-toggle="dropdown">Proyectos</a>
                  <div className="dropdown-menu bg-light rounded-0 rounded-bottom m-0">
                    <a href="/" className="dropdown-item">Features</a>
                    <a href="/" className="dropdown-item">Our Team</a>
                    <a href="/" className="dropdown-item">Testimonial</a>
                    <a href="/" className="dropdown-item">Quotation</a>
                    <a href="/" className="dropdown-item">404 Page</a>
                  </div>
                </div>
                <a href="contact.html" className="nav-item nav-link">Contáctenos</a>
              </div>
              <div className="ms-auto d-none d-lg-block">
                <a href="/" className="btn btn-primary rounded-pill py-2 px-3">Lorem ipsum</a>
              </div>
            </div>
          </nav>
        </div>
      </div>
      {/* Navbar End */}

      {/* Quote Start */}
      <div className="row bg-simulador">
        <div className="container-xxl py-5 ">
          <div className="container">
            <div className="row g-5">

              <div className="col-lg-6 wow fadeInUp pt-5" data-wow-delay="0.5s">
                <h2 className="title-simulador  mb-4 ">Simulador de pago para obligaciones urbanísticas </h2>

                <p className="descrip-simulador mb-5">Aquì podrás conocer en detalle la informaciòn correspondiente para tus obligaciones urbanisticas pendientes con el municipio de medellìn.</p>
                <div className="row g-3">

                  <form ref={fetchPOT} onSubmit={(e) => handleSubmit(e)}>
                    <div className="mb-3">
                      <label htmlFor="NumMatricula" className="form-label">Número de matricula</label>
                      <input name={"matricula"} value={formData.matricula} type="number" className="form-control" id="NumMatricula" aria-describedby="numMatriculaHelp" onChange={(e) => inputChangeHandler(e)} />
                      {
                        errors.matricula ? <div id="numMatriculaHelp" className="form-text text-danger">{errors.matricula}</div> : <div id="numMatriculaHelp" className="form-text">Por favor escriba el número de matricula, sólo se permiten caracteres numéricos.</div>
                      }

                    </div>
                    <div className="mb-3">
                      <label htmlFor="Metros" className="form-label">Cantidad de metros cuadrados</label>
                      <input name={"metros"} value={formData.metros} type="number" className="form-control" id="Metros" aria-describedby="metrosHelp" onChange={(e) => inputChangeHandler(e)} />
                      {
                        errors.metros ? <div id="metrosHelp" className="form-text text-danger">{errors.metros}</div> : <div id="metrosHelp" className="form-text">Por favor indique la cantidad de metros cuadrados por los que desea consultar.</div>
                      }
                    </div>
                    <div className="mb-3 form-check">
                      <input name={"acept"} type="checkbox" className="form-check-input" id="exampleCheck1" onChange={(e) => inputChangeHandler(e)} />
                      <label className="form-check-label" htmlFor="exampleCheck1">Acepta los términos y condiciones</label>
                      {
                        errors.acept && <div id="metrosHelp" className="form-text text-danger">{errors.acept}</div>
                      }
                    </div>
                    {
                      load ? <>
                      <Sipinner />
                      </>:
                      <>
                        <button type='button' style={{marginRight:'20px'}} className="btn btn-info rounded-pill py-3 px-5" onClick={() => restartForm()}>Reiniciar</button>
                        <button type="submit" className="btn btn-warning rounded-pill py-3 px-5">Calcular</button> 
                      </>
                    }
                  </form>



                  {/* <div className="col-sm-6 mb-4">
                    <div className="form-floating">
                      <input type="text" className="form-control" id="Matricula" placeholder="Your Name" />
                      <label htmlFor="number"> Numero de matrícula</label>
                    </div>
                  </div>

                  <div className="col-sm-6 mb-4">
                    <div className="form-floating">
                      <input type="text" className="form-control" id="Matricula" placeholder="Your Name" />
                      <label htmlFor="number">M2 del lote</label>
                    </div>
                  </div>


                  <div className="col-3 p-0 mb-5">
                    <a className="btn  btn-warning rounded-pill py-3 px-5" href="/">Calcular</a>
                  </div> */}


                </div>
              </div>

              <div className="col-lg-6 px-4 wow fadeInUp  d-lg-block d-none" data-wow-delay="0.1s">
                <picture className="second animated fadeInUp">
                  <source media="(min-width: 767px)" srcSet="img/img-simulador-1.png" />
                  <img src="img/img-simulador-1.png" alt="" />
                </picture>
              </div>
            </div>
          </div>
        </div>

      </div>
      {/* Quote Start */}

      {/* simulador Start */}
      {
        features.length > 0 && features.map((feature, index) => (
          <div className="row mb-5 pb-5" key={index}>
            <div className="container-xxl mt-n5">
              <div className="container z-index-sec">
                <div className="row g-0 feature-row">
                  <div className="col-md-6 col-lg-4 wow fadeIn mb-3" data-wow-delay="0.1s">
                    <div className="feature-item border h-100 px-3 py-4 ">
                      <div className="btn-square bg-light rounded-circle mb-4" style={{ width: "50px", height: "50px", margin: "0px auto" }}>
                        <img className="img-fluid" src="img/icon/icon-simulador-1.svg" alt="Icon" />
                      </div>
                      <h5 className="mb-3 text-center title-detalle text-primary">Calculo de obligación</h5>
                      <ul className="list-group list-group-flush list-simulador mb-4">
                        <li className="list-group-item">Comuna <span className="float-end"><strong>{feature.attributes.COMUNA}</strong></span></li>
                        <li className="list-group-item">Codigo catastral<span className="float-end"><strong>*{cbml}*</strong></span></li>
                        <li className="list-group-item">M2 calculados <span className="float-end"><strong>{formData.metros}</strong></span></li>
                        <li className="list-group-item">Valor por m2<span className="float-end"><strong>$ {addDotThousands(feature.attributes.VALOR_M2)}</strong></span></li>

                      </ul>
                      <div className="cont-valor-simulador bg-primary">Total obligaciones <br /> <span style={{ fontSize: "25px", fontWeight: 600 }}>$ {addDotThousands(feature.attributes.VALOR_M2 * parseInt(formData.metros))}</span> </div>
                    </div>
                  </div>

                  <div className="col-md-6 col-lg-4 wow fadeIn mb-3" data-wow-delay="0.1s">
                    <div className="feature-item border h-100 px-3 py-4 ">
                      <div className="btn-square bg-light rounded-circle mb-4" style={{ width: "50px", height: "50px", margin: "0px auto" }}>
                        <img className="img-fluid" src="img/icon/icon-simulador-2.svg" alt="Icon" />
                      </div>
                      <h5 className="mb-3 text-center title-detalle text-warning">Si pagas en efectivo</h5>
                      <ul className="list-group list-group-flush list-simulador mb-4">
                        <li className="list-group-item">Total obligaciones <span className="float-end"><strong>$ {addDotThousands(feature.attributes.VALOR_M2 * parseInt(formData.metros))}</strong></span></li>
                        <li className="list-group-item">Recargo  pago en efectivo <span className="float-end"><strong>+15%</strong></span></li>
                        <li className="list-group-item">Total recargo en efectivo <span className="float-end"><strong>$ {addDotThousands((feature.attributes.VALOR_M2 * parseInt(formData.metros)*0.15))}</strong></span></li>


                      </ul>
                      <div className="cont-valor-simulador bg-warning">Total pago en efectivo  <br /> <span style={{ fontSize: "25px", fontWeight: 600 }}>$ {addDotThousands((feature.attributes.VALOR_M2 * parseInt(formData.metros)) + (feature.attributes.VALOR_M2 * parseInt(formData.metros)*0.15))}</span> </div>
                    </div>
                  </div>

                  <div className="col-md-12 col-lg-4 wow fadeIn mb-3" data-wow-delay="0.1s">
                    <div className="feature-item border h-100 px-3 py-4 ">
                      <div className="btn-square bg-light rounded-circle mb-4" style={{ width: "50px", height: "50px", margin: "0px auto" }}>
                        <img className="img-fluid" src="img/icon/icon-simulador-1.svg" alt="Icon" />
                      </div>
                      <h5 className="mb-3 text-center title-detalle text-green">Pago con Palmaria</h5>
                      <ul className="list-group list-group-flush list-simulador mb-4">
                        <li className="list-group-item">Total obligaciones <span className="float-end"><strong>$ {addDotThousands((feature.attributes.VALOR_M2 * parseInt(formData.metros)) + (feature.attributes.VALOR_M2 * parseInt(formData.metros)*0.15))}</strong></span></li>
                        <li className="list-group-item">Recargo  pago en efectivo <span className="float-end"><strong className="text-danger">-15%</strong></span></li>
                        <li className="list-group-item">Descuento obligaciones <span className="float-end"><strong className="text-danger">-15%</strong></span></li>
                        <li className="list-group-item">Total ahorro en efectivo <span className="float-end"><strong>$ {addDotThousands((feature.attributes.VALOR_M2 * parseInt(formData.metros)*0.15) + (feature.attributes.VALOR_M2 * parseInt(formData.metros)*0.15))}</strong></span></li>
                      </ul>
                      <div className="cont-valor-simulador bg-green-cont">Total obligaciones <br /> <span style={{ fontSize: "25px", fontWeight: 600 }}>$ {addDotThousands(((feature.attributes.VALOR_M2 * parseInt(formData.metros)) + (feature.attributes.VALOR_M2 * parseInt(formData.metros)*0.15)) - ((feature.attributes.VALOR_M2 * parseInt(formData.metros)*0.15) + (feature.attributes.VALOR_M2 * parseInt(formData.metros)*0.15)))}</span> </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      }
      {/* simulador End */}

      {/* Footer Start */}
      <div className="container-fluid bg-dark footer mt-5 py-5 wow fadeIn" data-wow-delay="0.1s">
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
      </div>
      {/* Footer End */}

      {/* Copyright Start */}
      <div className="container-fluid copyright py-4">
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
      </div>
      {/* Copyright End */}

      {/* Back to Top */}
      <a href="/" className="btn btn-lg btn-primary btn-lg-square rounded-circle back-to-top"><i className="bi bi-arrow-up"></i></a>
    </>
  );
}

export default App;
