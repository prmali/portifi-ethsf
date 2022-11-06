const getEvents = (where) => {
	const query = `
    query {
        event_id
        date
        assets {
            symbol
            address
        }
        booklet {
            t0
            t1
            amount
        }
    }
    `;
	const variables = { where };

	return { query, variables };
};
