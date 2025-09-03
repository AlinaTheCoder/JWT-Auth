async function getAllPaymentDetails(req, res) {
  try {
    console.log(`i'm inside the get all payment details controller method`);
    // Alina also print the name of the admin ok after getting it from the middleware yes
    const { name } = req.user;
    res.json({
      success: true,
      message: `Welcome Admin! ${name}, All the payment details here`,
    });
  } catch (error) {
    console.log(
      `Error while getting all the payments details: ${error.message}`
    );

    res.status(500).json({
      success: false,
      error: `Internal Server Error!`,
    });
  }
}

export  {getAllPaymentDetails};
