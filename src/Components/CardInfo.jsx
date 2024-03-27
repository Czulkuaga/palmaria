import React from 'react'
import Sipinner from './Sipinner'
import ApiService from '../Service/ApiService'

const defaultData = {
    matricula: "",
    metros: "",
    acept: false
}

const OBTAIN_CBL_API_URL = `https://www.medellin.gov.co/site_consulta_pot/BuscarFichaMat.hyg?buscar=`

const CardInfo = () => {
    const [load, setLoad] = React.useState(false)
    const [errors, setErrors] = React.useState({})
    const [formData, setFormData] = React.useState(defaultData)
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
            console.log(obtainCBL)
            if (obtainCBL.code !== '200') {
                setLoad(false)
                setFormData(defaultData)
                return
            }
            const obtainPOT48Data = await ApiService.obtainPOT48Data(obtainCBL.data.cbml)
            console.log(obtainPOT48Data)
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

            const spartialReference = obtainPOT48Data.data.spatialReference

            const obtainM2value = await ApiService.obtainValueM2(xmin, ymin, xmax, ymax, spartialReference)

            console.log(obtainM2value)
            setFeatures(obtainM2value.data.features)
            setLoad(false)
        } catch (error) {
            setLoad(false)
            console.log(error)
            setFormData(defaultData)
        }
    }

    return (
        <>
            <div className="card w-50 mx-auto">
                <div className="card-header">
                    Palmaria Consulta
                </div>
                {
                    load ? <>
                        <Sipinner />
                    </> :
                        <>
                            <div className="card-body">
                                <h5 className="card-title">Ingresa el código de la matricula y la cantidad de m2 a consultar.</h5>

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
                                    <button type="submit" className="btn btn-primary">Consultar</button>
                                </form>
                            </div>
                        </>
                }
            </div>

            <div className="card-group mt-5 mb-5">
                {
                    features.length > 1 && features.map((feature, index) => (
                        <div className="card mx-auto" key={index}>
                            <div className="card-header">
                                {feature.attributes.OBJECTID}
                            </div>
                            <div className="card-body">
                                <p>Comuna: {feature.attributes.COMUNA}</p>
                                <p>Valor M2: $ {addDotThousands(feature.attributes.valor_m2)}</p>
                                <p>Vigencia: {feature.attributes.VIGENCIA}</p>
                                <p>Valor Consultado: $ {addDotThousands(feature.attributes.valor_m2 * parseInt(formData.metros))}</p>
                                <p>Valor a pagar: $ {addDotThousands(parseInt((feature.attributes.valor_m2 * parseInt(formData.metros))*1.15))}</p>
                            </div>
                        </div>
                    ))
                }
            </div>
        </>
    )
}

export default CardInfo