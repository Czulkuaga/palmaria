import React from 'react'
import Sipinner from './Sipinner'
import ApiService from '../Service/ApiService'

const defaultData = {
    matricula: "",
    metros: "",
    acept: false
}

const CardInfo = () => {
    const [load, setLoad] = React.useState(false)
    const [errors, setErrors] = React.useState({})
    const [formData, setFormData] = React.useState(defaultData)

    const fetchPOT = React.useRef(null)

    //RegExp
    const validarMatricula = /^[0-9]{1,8}$/g
    const validarMetros = /^[0-9]{1,6}$/g

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
            const obtainCBL = await ApiService.obtainCBL(formData.matricula)
            console.log(obtainCBL)
            setLoad(false)
        } catch (error) {
            setLoad(false)
            console.log(error)
        }
    }

    return (
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
    )
}

export default CardInfo