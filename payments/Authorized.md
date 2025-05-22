# Authorized.net Payment Integration in Nodejs



### Backend Code


```js

// app/api/process/route.js

import { NextResponse } from "next/server";
import { APIContracts, APIControllers, Constants } from "authorizenet";

export async function POST(req) {
  try {
    // 1) Parse & validate
    const {
      opaqueData,
      amount,
      name,
      email,
      phone,
      address,
      city,
      state,
      postalCode,
      country,
      firstName,
      lastName
    } = await req.json();


    const user = await iGUser(name , email);
    if(!user.success){
      return NextResponse.json(
        { success: false, error: user.message },
        { status: 400 }
      );
    }


    if (!opaqueData?.dataDescriptor || !opaqueData?.dataValue) {
      return NextResponse.json(
        { success: false, error: "Invalid opaqueData" },
        { status: 400 }
      );
    }

    const numericAmount = parseFloat(amount.replace(/[^0-9.]/g, ""));
    if(numericAmount < 10 || numericAmount > 500){
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }
    if (isNaN(numericAmount)) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }



    const merchantAuth = new APIContracts.MerchantAuthenticationType();
    merchantAuth.setName(process.env.AUTHNET_API_LOGIN_ID);
    merchantAuth.setTransactionKey(process.env.AUTHNET_TRANSACTION_KEY);



    // 3) Opaque payment data
    const opaque = new APIContracts.OpaqueDataType();
    opaque.setDataDescriptor(opaqueData.dataDescriptor);
    opaque.setDataValue(opaqueData.dataValue);
    const payment = new APIContracts.PaymentType();
    payment.setOpaqueData(opaque);



    // 4) Billing & customer data
    const billTo = new APIContracts.CustomerAddressType();
    billTo.setFirstName(firstName);
    billTo.setLastName(lastName);
    billTo.setAddress(address);
    billTo.setCity(city);
    billTo.setState(state);
    billTo.setZip(postalCode);
    billTo.setCountry(country);
    billTo.setPhoneNumber(phone);

    const customer = new APIContracts.CustomerDataType();
    customer.setEmail(email);
    customer.setType(APIContracts.CustomerTypeEnum.INDIVIDUAL);


    // 5) Build transaction request
    const txnRequest = new APIContracts.TransactionRequestType();
    txnRequest.setTransactionType(
      APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION
    );
    const newAmount = numericAmount + 3;
    txnRequest.setAmount(newAmount.toFixed(2));
    txnRequest.setPayment(payment);
    txnRequest.setBillTo(billTo);
    txnRequest.setCustomer(customer);


    // 6) Wrap in CreateTransactionRequest
    const createTxnReq = new APIContracts.CreateTransactionRequest();
    createTxnReq.setRefId(`ref${Date.now()}`);
    createTxnReq.setMerchantAuthentication(merchantAuth);
    createTxnReq.setTransactionRequest(txnRequest);

    // 7) Execute against SANDBOX endpoint
    const controller = new APIControllers.CreateTransactionController(
      createTxnReq.getJSON()
    );
    // *** This is the critical line: ***
    controller.setEnvironment(Constants.endpoint.production);

    const rawResponse = await new Promise((resolve, reject) => {
      controller.execute((error /*, response*/) => {
        if (error) return reject(error);

        const apiResp = controller.getResponse();
        if (!apiResp) {
          return reject(
            new Error("Empty response from Authorize.Net (via getResponse())")
          );
        }
        resolve(apiResp);
      });
    });

    // 8) Parse & return
    const resp = new APIContracts.CreateTransactionResponse(rawResponse);

    if (
      resp.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK
    ) {
      const tr = resp.getTransactionResponse();
      const responseCode = tr.getResponseCode();
      const transId = tr.getTransId();
      console.log(JSON.stringify(tr), "-------------------- tr");
      console.log(JSON.stringify(responseCode),"-------------------- responseCode");
      console.log(JSON.stringify(transId), "-------------------- transId");

      const userData = {
        userName: user.data.username,
        amount: amount,
        user : user.data
      };

      if (responseCode === "1") {
        const igResult = await savePaymentIgFollowers(tr, userData);
        if (igResult.success) {
          // Transaction was approved
          return NextResponse.json({
            success: true,
            transactionId: transId,
            message: "Payment is Successful",
          });
        } else {
          return NextResponse.json(
            {
              success: false,
              pending: false,
              transactionId: transId,
              error: igResult.message,
            },
            { status: 400 }
          );
        }

      } else if (responseCode === "4") {
        const igResult = await savePaymentIgFollowers(tr, userData);
        if (igResult.success) {
          return NextResponse.json(
            {
              success: true,
              pending: true,
              transactionId: transId,
              message:
                tr?.messages?.message[0]?.description ||
                "Transaction is held for review by the payment gateway.",
            },
            { status: 202 }
          );
        } else {
          return NextResponse.json(
            {
              success: false,
              pending: false,
              transactionId: transId,
              error: igResult.message,
            },
            { status: 400 }
          );
        }
      } else {
        const errorMessage =
          tr.getErrors()?.getError()[0]?.getErrorText() ||
          resp.getMessages().getMessage()[0].getText() ||
          "Transaction failed";

        return NextResponse.json(
          {
            success: false,
            declined: true,
            transactionId: transId,
            reason: errorMessage,
            error: errorMessage,
          },
          { status: 402 }
        );
      }
    } else {
      const msg = resp.getMessages().getMessage()[0].getText();
      return NextResponse.json(
        { success: false,  error: resp?.transactionResponse?.errors?.error[0]?.errorText || msg || "Transaction failed" },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

const savePaymentIgFollowers = async (paymentData, userData) => {
  try {
    const res = await fetch(
      "https://igmorefollowers.com/adminapi/v2/payments/add",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": process.env.IG_FOLLOWERS_TOKEN,
        },
        body: JSON.stringify({
          username: userData.user.username,
          amount: parseFloat(userData.amount),
          method: `Perfect Money USD`,
          // memo: "added via Admin API",
          // affiliate_commission: false,
          // user_id : userData.user.id,
          // user_email : userData.user.email
        }),
      }
    );
    const resData = await res.json();
    console.log(resData , "resDataresData")
    if (res.status === 200) {
      return {
        success: true,
        message: "Payment added to site",
      };
    } else {
      return {
        success: false,
        message: `${resData.error} Payment is successful, error in adding data to igmorefollowers. Please contact us your transId is ${paymentData.transId} `,
      };
    }
  } catch (error) {
    console.log(error , "error")
    return {
      success: false,
      message: `${error.message} Payment is successful, error in adding data to igmorefollowers. Please contact us your transId is ${paymentData.transId} `,
    };
  }
};



const iGUser = async (userName ,email)=>{
   
  try {
  const res = await fetch(`https://igmorefollowers.com/adminapi/v2/users?username=${userName}&email=${email}`,{
    method  :"GET",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": process.env.IG_FOLLOWERS_TOKEN,
    },
  });

  const data = await res.json();
  if(data?.data?.count == 1){
     return {
      success : true,
      data : data?.data?.list[0]
     }
  }else{
    return {
      success : false,
      message : data?.error_message || "Invalid userName. Please inter your igmorefollowers userName or email"
    }
  }
  } catch (error) {
    return{
      success : false,
      message : error.message || "Internal server error"
    }
  }
}


```


### FrontEnd Code 

```js

// app/payment/page.tsx
"use client";
import { useState, useEffect } from "react";
import { usePaymentInputs } from "react-payment-inputs";
import {
  validateCardNumber,
  validateExpiryDate,
  validateCVV,
} from "@/utils/validation";
import {
  FaCcMastercard,
  FaCcVisa,
  FaCcAmex,
  FaCcDiscover,
  FaCcDinersClub,
  FaCcJcb,
  FaCcPaypal,
  FaCreditCard,
} from "react-icons/fa";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

export default function PaymentPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    amount: "",
    firstName: "",
    lastName: "",
    acceptedTOS : false,
  });
  const { getCardNumberProps, getExpiryDateProps, getCVCProps, meta } =
    usePaymentInputs();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [resError, setResError] = useState("");
  const [resSuccess, setResSuccess] = useState("");

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.authorize.net/v1/Accept.js"; //pro
    // script.src = "https://jstest.authorize.net/v1/Accept.js"; // sand box

    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};

    // Card validation
    if (formData.number && !validateCardNumber(formData.number)) {
      newErrors.card = "Invalid card number";
    }

    if (formData.expiry && !validateExpiryDate(formData.expiry)) {
      newErrors.card = "Invalid expiration date";
    }

    if (formData.cvc && !validateCVV(formData.cvc, meta.cardType?.type)) {
      newErrors.card = "Invalid CVV";
    }

    if (!formData.number || !formData.expiry || !formData.cvc)
      newErrors.card = "Card fields required";

    // Basic field validation
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phone) newErrors.phone = "Phone is required";
    if (!formData.address) newErrors.address = "Address is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.postalCode) newErrors.postalCode = "Postal code is required";
    if (!formData.country) newErrors.country = "Country is required";
    if (!formData.amount) newErrors.amount = "Amount is required";
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.country) newErrors.country = "Country is required";

    // Email format validation
    if (
      formData.email &&
      !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(formData.email)
    ) {
      newErrors.email = "Invalid email format";
    }


    if(!formData.acceptedTOS){
       newErrors.acceptedTOS = "error"
   }

   if(formData.amount < 10 || formData > 500){
      newErrors.amount = "Enter amount between $10 and $500"
   }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

   
    if (!window.Accept) {
      alert("Payment processor not loaded yet");
      return;
    }

    setLoading(true);
    setResError("");
    setErrors({});
    setResSuccess("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const authData = {
      clientKey: process.env.NEXT_PUBLIC_CLIENT_KEY,
      apiLoginID: process.env.NEXT_PUBLIC_AUTHNET_API_LOGIN_ID,
    };

    try {
      // @ts-ignore - AcceptJS type declaration
      Accept.dispatchData(
        {
          authData: authData,
          cardData: {
            cardNumber: formData.number.replace(/\s/g, ""),
            month: formData.expiry.split("/")[0]?.padStart(2, "0").trim(),
            year: formData.expiry.split("/")[1].trim(),
            cardCode: formData.cvc,
          },
        },
        async (response) => {
          if (response.messages.resultCode === "Error") {
            setLoading(false);
            return setResError(response.messages.message[0].text);
          }

          const result = await fetch("/api/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              opaqueData: response.opaqueData,
              amount: `${formData.amount}$`,
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              postalCode: formData.postalCode,
              country: formData.country,
              firstName: formData.firstName,
              lastName: formData.lastName,
            }),
          });

          const data = await result.json();
          if (!data.success) {
            setLoading(false);
            return setResError(data.error);
          }
          setResError("");
          setResSuccess(data.message);
          setLoading(false);
          // reset the form
          setFormData({
            name: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            postalCode: "",
            country: "US",
            amount: "",
            firstName: "",
            lastName: "",
            acceptedTOS : false
          });
        }
      );
    } catch (error) {
      setLoading(false);
      errors.resError = error.error;
    }
  };

  const CommonClass =
    "w-[100%] border-[1px] border-[#e1e0e0] bg-[#F9F9F9] outline-none px-2 py-2 text-[14px] rounded-sm";

  const CardIcon = ({ type }) => {
    const iconMap = {
      mastercard: <FaCcMastercard className="text-red-600" />,
      visa: <FaCcVisa className="text-blue-600" />,
      amex: <FaCcAmex className="text-indigo-500" />,
      discover: <FaCcDiscover className="text-orange-500" />,
      diners: <FaCcDinersClub className="text-cyan-500" />,
      jcb: <FaCcJcb className="text-purple-500" />,
      paypal: <FaCcPaypal className="text-blue-500" />,
    };

    return (
      <div className="text-[30px]">
        {iconMap[type?.toLowerCase()] || (
          <FaCreditCard className="text-gray-400" />
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[600px] mx-auto p-6 bg-white my-[20px]">
      <h1 className="text-2xl font-bold mb-6 text-center">Add Funds to
      <a href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-500 pl-2"
            >
              example.com
            </a>
         </h1>
      {resError && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-3"
          role="alert"
        >
          {/* <strong class="font-bold">Holy smokes!</strong> */}
          <span className="block sm:inline">{resError}.</span>
        </div>
      )}

      {/* ------- success  */}
      {resSuccess && (
        <div
          class="bg-teal-100 mb-6 border-t-4 border-teal-500 rounded-b text-teal-900 px-4 py-3 shadow-md"
          role="alert"
        >
          <div class="flex">
            <div>
              <p class="font-bold">Payment Successful</p>
              <p class="text-sm">{resSuccess}.</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* // username  */}
        <div>
          <input
            className={`${CommonClass} ${errors.name ? "border-red-500" : ""}`}
            placeholder="Enter your igmorefollowers username"
            value={formData.name}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, name: e.target.value }));
            }}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        <div>
          <input
            type="email"
            value={formData.email}
            placeholder="Enter your igmorefollowers email"
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            className={`w-full outline-none ${CommonClass} ${
              errors.email ? "border-red-500" : ""
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
        </div>

       

        {/* --------- card div  */}
        <div>
          <div
            className={`grid grid-cols-[1fr_.4fr_.4fr] border-[1px] border-[#e1e0e0] bg-[#F9F9F9] px-2 rounded-sm text-[15px] ${
              errors.card ? "border-red-500" : ""
            }`}
          >
            <div className="flex justify-start place-items-center gap-1.5">
              <CardIcon type={meta?.cardType?.type} />
              <input
                {...getCardNumberProps({
                  onChange: (e) =>
                    setFormData((prev) => ({
                      ...prev,
                      number: e.target.value,
                    })),
                })}
                className={`w-full p-2 border-none outline-none ${
                  errors.number ? "border-red-500" : ""
                }`}
              />
              {errors.number && (
                <p className="text-red-500 text-sm">{errors.number}</p>
              )}
            </div>

            <div>
              <input
                {...getExpiryDateProps({
                  onChange: (e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expiry: e.target.value,
                    })),
                })}
                className={`w-full p-2 border-none outline-none ${
                  errors.expiry ? "border-red-500" : ""
                }`}
              />
              {errors.expiry && (
                <p className="text-red-500 text-sm">{errors.expiry}</p>
              )}
            </div>

            <div>
              <input
                {...getCVCProps({
                  onChange: (e) =>
                    setFormData((prev) => ({ ...prev, cvc: e.target.value })),
                })}
                className={`w-full p-2 border-none outline-none ${
                  errors.cvc ? "border-red-500" : ""
                }`}
              />
              {errors.cvc && (
                <p className="text-red-500 text-sm">{errors.cvc}</p>
              )}
            </div>
          </div>
          {errors.card && <p className="text-red-500 text-sm">{errors.card}</p>}
        </div>

         {/* // amount  */}
         <div className="mb-[20px]">
          <input
            className={`${CommonClass} ${
              errors.amount ? "border-red-500" : ""
            }`}
            placeholder="Enter amount between $10 and $500"
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, amount: e.target.value }));
            }}

            value={formData.amount}
          />
          {errors.amount && (
            <p className="text-red-500 text-sm">{errors.amount}</p>
          )}
        </div>

        {/* // first name  / last name  */}
        <div className="grid grid-cols-2 gap-2 mt-[20px] ">
          <div>
            <input
              className={`${CommonClass} ${
                errors.firstName ? "border-red-500" : ""
              }`}
              placeholder="Enter Firstname"
              value={formData.firstName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, firstName: e.target.value }))
              }
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm">{errors.firstName}</p>
            )}
          </div>

          <div>
            <input
              className={`${CommonClass} ${
                errors.lastName ? "border-red-500" : ""
              }`}
              placeholder="Enter Lastname"
              value={formData.lastName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, lastName: e.target.value }))
              }
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <div>
            <PhoneInput
              country={"us"}
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e }))}
              className={`w-full rounded ${
                errors.phone ? "border-red-500" : ""
              }`}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={formData.address}
              placeholder="Enter Street Address"
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              className={`w-full p-2 border rounded outline-none ${CommonClass} ${
                errors.address ? "border-red-500" : ""
              }`}
            />
            {errors.address && (
              <p className="text-red-500 text-sm">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <input
                mask="99999"
                value={formData.postalCode}
                placeholder="Post code"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    postalCode: e.target.value,
                  }))
                }
                className={`w-full p-2 border rounded outline-none ${CommonClass} ${
                  errors.postalCode ? "border-red-500" : ""
                }`}
              />
              {errors.postalCode && (
                <p className="text-red-500 text-sm">{errors.postalCode}</p>
              )}
            </div>

            <div>
              <input
                type="text"
                value={formData.city}
                placeholder="City"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
                className={`w-full p-2 border rounded outline-none ${CommonClass} ${
                  errors.city ? "border-red-500" : ""
                }`}
              />
              {errors.city && (
                <p className="text-red-500 text-sm">{errors.city}</p>
              )}
            </div>

            <div>
              <input
                type="text"
                value={formData.state}
                placeholder="State / territory"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, state: e.target.value }))
                }
                className={`w-full p-2 border rounded outline-none ${CommonClass} ${
                  errors.state ? "border-red-500" : ""
                }`}
              />
              {errors.state && (
                <p className="text-red-500 text-sm">{errors.state}</p>
              )}
            </div>
          </div>

          <div>
            <select
              value={formData.country}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, country: e.target.value }))
              }
              className={`w-full p-2 border rounded ${CommonClass} ${
                errors.country ? "border-red-500" : ""
              }`}
            >
              <option value="">Select Country</option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="UK">United Kingdom</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
            </select>
            {errors.country && (
              <p className="text-red-500 text-sm">{errors.country}</p>
            )}
          </div>
        </div>

        {/* =============== terms and conditions  */}

        <div className="flex items-start mb-5">
        <div className="flex items-center h-5">
          <input
            id="tos-confirm"
            type="checkbox"
            checked={formData.acceptedTOS}
            onChange={(e) => setFormData((pre)=> ({...pre , acceptedTOS : !formData.acceptedTOS}))}
            className="w-4 h-4 border border-gray-300 rounded-sm bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800"
            required
          />
        </div>
        <label
          htmlFor="tos-confirm"
          className={`ms-2 text-sm font-medium text-gray-900 dark:text-gray-300 ${!formData?.acceptedTOS && "!text-[red]"}`}
        >
          I have read and agree to the{' '}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-500"
          >
            Terms of Service and Refund Policy
          </a>
        </label>
      </div>

        {/* ======================= start buttons  */}

        <p className="mt-[20px] text-[red] text-center">
          A $3 fee will be added to each transaction.
        </p>
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-[#4A90E2] flex justify-center place-items-center gap-2 text-white py-3 px-6 rounded hover:bg-[#80bbff] cursor-pointer disabled:bg-gray-400 transition-colors ${
            loading && "!cursor-no-drop"
          }`}
        >
          {loading ? "Processing..." : "Pay"}
          {loading && (
            <div
              className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white `}
              role="status"
            >
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
              </span>
            </div>
          )}
        </button>
      </form>
    </div>
  );
}


```